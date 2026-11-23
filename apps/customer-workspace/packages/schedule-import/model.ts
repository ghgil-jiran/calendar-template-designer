import Anthropic from "@anthropic-ai/sdk";
import { read, utils } from "xlsx";
import mammoth from "mammoth";
import { parseMonthlyScheduleLine, zipXml } from "./schedule-extraction.ts";
import { parseHwpxCalendarGrid, formatGridHits } from "./hwpx-grid.ts";
import { isLegalHoliday } from "./legal-holiday-names.ts";
import {
  extractedScheduleSchema,
  summarizeSchedules,
  type AiErrorCode,
  type ExtractedSchedule,
  type ScheduleExtractResponse,
} from "./model-contracts.ts";

const MODEL = "claude-haiku-4-5-20251001"; // 비용 최저 — 방실장님 확정 (모델 고정)
const REQUEST_TIMEOUT_MS = 45_000; // 일정 분석 호출당 45초
const MAX_TOKENS = 8192;

const TEXT_EXTENSIONS = new Set(["csv", "txt"]);
const SHEET_EXTENSIONS = new Set(["xlsx", "xls"]); // G4: sheetjs로 시트→텍스트
// docx=mammoth, hwpx=jszip은 개별 분기로 처리 (아래 extract* 함수)

// 고객 2차 UAT 2-2(260731 메일) — 형식별(54/50/35/51)·회차별 건수 편차의 근본 원인은 파일
// 파싱이 아니라(4형식 모두 56건 전달 실측 확인) 추출 규칙의 "재량"이었다:
//   ①시작/종료 쌍을 몇 개 병합할지 형식마다 달랐고 ②간헐적으로 교육주간·특강·훈련 같은
//   학사 항목 18건을 "학교 고유 일정이 아니다"로 오판해 통째로 빼는 모드(35건)가 발생.
// 아래처럼 규칙을 강제(전건 추출 + 병합 규칙 명시 + 자가 대조)하니 4형식×3회=12회 전부
// 50건·유실 0으로 안정화됨(50 = 원본 56행 − 시작/종료 6쌍 병합). 완화 금지.
// 260803 김예슬님 실학교 원고 3종 검증 반영 — 규칙 추가분(주간·괄호 보존·격자형·연도 매핑·
// 다건 분리 강화)은 등서초(달력 격자 xlsx)·세현고(주간 격자 xlsx)의 실측 재현 결과에 근거.
// 특히 세현고에서 교직원연수 전멸·12/29~30 통째 누락·기말고사 기간 축소가 재현됨. 완화 금지.
const SOURCE_TRANSCRIPTION_PROMPT = [
  "학사일정 표를 원문 그대로 전사하고 save_schedules로 제출하세요.",
  "학사연도 2027-03-01 ~ 2028-02-29 틀로 추출합니다. 파일에 적힌 연도와 무관하게 3~12월은 2027년, 1~2월은 2028년으로 매핑하세요(월·일은 문서 그대로).",
  "페이지의 안내문과 예시는 제외하세요. 일정 표의 월 열과 바로 옆 일정 열이 한 쌍입니다. 좌우에 표가 나란히 있으면 각 쌍을 따로 읽으세요.",
  "한 줄에 날짜 하나와 일정명이 있으면 한 건입니다. 쉼표, 슬래시, 괄호, 띄어쓰기, 학년 번호 및 오타를 그대로 복사하세요. 맞춤법 교정, 이름 추측, 일정 분리 또는 병합을 하지 마세요.",
  "날짜가 따로 적힌 줄은 이름이나 날짜가 같아도 별개로 읽으세요. 날짜 범위는 해당 줄에만 적용하고, 종료일이 명시되지 않으면 endDate를 생략하고 endExplicit을 false로 제출하세요.",
  "월 표기가 있는 셀의 경계를 확인하고 빈 월에는 일정을 넣지 마세요. 일정명이나 날짜를 판독할 수 없으면 임의로 채우지 마세요.",
  "법정 공휴일을 포함해 원문에서 읽힌 모든 일정을 제출하세요. documentDateCount는 판독 여부와 무관하게 표에 날짜가 적힌 줄 수입니다.",
  "category는 일정명과 별도로 분류하세요. date와 endDate는 YYYY-MM-DD입니다.",
].join("\n");

const SYSTEM_PROMPT = [
  "당신은 한국 학교의 학사일정 파일에서 일정을 추출하는 도구입니다.",
  "학사연도 2027-03-01 ~ 2028-02-29 틀로 추출합니다. 파일에 적힌 연도와 무관하게 3~12월은 2027년, 1~2월은 2028년으로 매핑하세요(월·일은 문서 그대로).",
  "규칙:",
  "- 문서에 날짜와 함께 적힌 학교 일정은 전부 추출하세요. 행사·학사·시험·방학 등 구분과 무관하게 단 한 건도 빠뜨리면 안 됩니다. 교육주간·훈련·특강·검사·준비주간 같은 학사 항목도 반드시 포함합니다. 문서의 마지막 페이지 마지막 줄(2월 말)까지 끝까지 읽고 마지막 항목을 반드시 포함하세요.",
  "- 날짜는 YYYY-MM-DD. 기간 일정(방학, 시험 기간 등)은 date=시작일, endDate=종료일. 기간 표기(예: 11/17~24, (~12일), (8일~16일))는 적힌 종료일 그대로 반영하고 임의로 줄이지 마세요. endDate가 date보다 빠르면 안 됩니다(해를 넘는 방학만 예외).",
  "- 같은 이름의 '시작' 행과 '종료' 행(예: '여름방학 특강 시작'/'여름방학 특강 종료')은 반드시 하나의 기간 일정으로 병합하세요: date=시작일, endDate=종료일, label='여름방학 특강'.",
  "- 이름에 '주간'이 들어가는데 그 일정 자체에 종료 표기가 없으면 endDate를 넣지 마세요(서버가 주 단위로 자동 보정합니다). 같은 칸의 다른 일정에 기간 표기나 반복 표기가 있어도 그것을 이 주간의 종료일로 가져오면 안 됩니다 — 예외 없이 endDate를 비웁니다. 그 일정 자체에 종료 표기가 있으면(예: 상담주간(~3/29), 학생상담주간(31~4.4일), 행사주간(~18)) 그 표기를 endDate로 그대로 쓰세요 — 명시된 종료일은 토요일·일요일이어도 절대 바꾸지 마세요.",
  "- 각 일정에 endExplicit을 반드시 넣으세요: 원문에 '그 일정 자체'의 종료 표기(괄호 기간, ~표기, 시작/종료 행 쌍)가 있으면 true, 없으면 false. 옆 일정의 기간 표기는 해당되지 않습니다. 서버가 이 값으로 '종료 표기 없는 주간'만 골라 보정하므로 정확해야 합니다.",
  "- 괄호 안 내용은 삭제하지 말고 일정명에 그대로 보존하세요(예: '여름방학식(급식있음)'은 그대로). 괄호 안이 순수한 기간 표기(예: (3/9~13), (~12일))인 경우에만 기간으로 해석하고 이름에서 뺄 수 있습니다.",
  "- 한 줄(한 칸)에 서로 다른 일정이 여러 개 적혀 있으면 줄바꿈·쉼표·슬래시 기준으로 각각 별개 일정으로 분리하세요. 예: '9(월): 학부모상담기간 수업공개주간(3/9~13)' → ①학부모상담기간 ②수업공개주간(3/9~13). 칸 마지막 줄의 항목(예: '교직원연수')도 절대 빠뜨리지 마세요.",
  "- 괄호로 표기된 기간은 그 괄호 '바로 앞' 일정에만 귀속됩니다. 같은 칸의 다른 일정에 그 기간을 적용하면 안 됩니다. 예: '17 방과후1분기시작 교내발명품경진대회 (17~21일) 생명존중자살예방교육주간' → ①방과후1분기시작(3-17) ②교내발명품경진대회(3-17~3-21, endExplicit true) ③생명존중자살예방교육주간(3-17, endDate 없음, endExplicit false — 괄호 기간은 ②의 것이므로 가져오지 않음). 마찬가지로 '24 생존수영교육 아동학대가정폭력예방주간'에서 생존수영교육이 다른 날에도 이어지더라도 아동학대가정폭력예방주간의 endDate는 비웁니다.",
  "- 한 칸에 '주간' 일정이 여러 개 나열되어 있으면 각각 독립 일정으로 전부 추출하세요. 예: '21 장애이해교육주간 세계책의날 주간' → ①장애이해교육주간(4-21) ②세계책의날 주간(4-21). '세계책의날 주간'처럼 이름 중간에 공백이 있어도 하나의 일정명입니다. 이런 칸을 통째로 건너뛰는 것은 심각한 누락입니다.",
  "- 달력 모양(요일 격자) 파일에서는 각 칸의 선두 숫자가 '일'이고, 시트명이나 행 앞의 월 표기가 '월'입니다. 요일 이름(일·월·화·수·목·금·토) 헤더와 숫자만 있는 칸은 일정이 아닙니다. @·$·# 같은 표기 기호는 무시하되, 그 기호가 붙은 일정 자체는 반드시 추출하세요.",
  "- 격자에서 달 소속은 행 앞의 월 표기보다 날짜 연속성이 우선입니다. 바로 위 행이 12월 22~28이었는데 다음 행이 '1,29,목요수업,30,진학설명회,31,,1,신정,2,방학식'이라면 — 행 머리의 1은 '이 주에 1월이 시작된다'는 뜻일 뿐이므로 — 29·30·31의 일정(목요수업·진학설명회)은 반드시 12월(12-29·12-30)로, 1·2의 일정(신정·방학식)만 1월로 추출하세요.",
  // 260806 QA-605 §3 — 세현고 원고에서 같은 파일을 두 번 돌리면 4건이 12월↔1월로 흔들렸다
  //   (목요수업 12-29↔1-29 등). 위 규칙이 있는데도 지켜지지 않아 판정 기준을 기계적으로 못박는다.
  //   날짜가 흔들리면 중복 차단 키(날짜|이름)가 무력해져 재업로드마다 일정이 쌓인다.
  "- ⚠ 위 규칙을 적용할 때 판단 기준은 단 하나입니다: **그 행에서 날짜 숫자가 큰 값(29·30·31 등)에서 작은 값(1·2 등)으로 꺾이는 지점**을 찾고, 꺾이기 **전**은 앞 달, 꺾인 **후**만 다음 달입니다. 행 머리의 월 표기, 요일, 일정 이름은 이 판단에 쓰지 마세요. 한 행 안에서 달이 두 번 바뀌는 일은 없습니다. 12월→1월 경계에서 특히 자주 틀리므로 제출 전에 12월 마지막 주 행을 한 번 더 검산하세요.",
  "- 한 줄 전체가 괄호로 싸인 항목(예: '(진급졸업사정회)')도 독립된 일정입니다. 괄호를 벗겨 반드시 추출하세요.",
  "- category: 시험류=exam, 방학류=vacation, 학교 행사(입학식·졸업식·체육대회·소풍 등)=event, 그 외=custom.",
  // 260806 QA-606 근본 수정 — "무엇을 뺄지"를 AI에게 묻던 규칙을 **전부 걷어냈다.**
  //   원고(세현고)의 범례가 `휴일$ 고사# 행사&` 였다. 학교는 법정 공휴일과 재량휴업일·수능을
  //   전부 "휴일"로 묶어 적었고 원고에 그 구분이 없다. 그런데도 "법정 공휴일만 빼라"고 시키니
  //   AI가 매번 짐작해야 했고, 같은 파일을 두 번 돌려도 결과가 달라졌다(QA 실측 —
  //   넓게 빼면 재량휴업일·수능·학력평가 실종, 좁게 빼면 대체공휴일·현충일 역유입).
  //   → **AI는 문서에 있는 것을 전부 그대로 가져오고, 무엇이 법정 공휴일인지는 서버가
  //     이름 목록(LEGAL_HOLIDAY_NAMES)으로 판정한다.** 학교마다 기호가 달라도 흔들리지 않는다.
  "- ⚠ 어떤 항목도 스스로 판단해 빼지 마세요. 법정 공휴일(설날·추석·삼일절·현충일·대체공휴일 등)이 문서에 적혀 있어도 **그대로 추출**하세요 — 걸러내는 일은 프로그램이 따로 합니다. 여러분이 뺄 것을 고르면 재량휴업일·수능·학력평가·방학식처럼 반드시 있어야 할 일정까지 함께 사라집니다.",
  "- 문서에 적힌 학교 일정은 이름에 '교육'·'주간'·'휴업'이 들어가도 전부 포함하세요. 특히 재량휴업일 · 학교장재량휴업일 · 대학수학능력시험(수능) · 학력평가 · 모의고사 · 방학식 · 개학식 · 졸업식 · 입학식 · 단축수업 · 등교시간 조정은 학부모·교사가 가장 많이 확인하는 정보라 절대 빠뜨리면 안 됩니다. 공휴일이 여러 날 몰려 있는 주(예: 10월 초 개천절·추석·한글날 구간)에서 그 주의 학교 일정을 통째로 건너뛰는 것은 심각한 누락입니다.",
  "- 문서에 있는 일정만 추출하고, 없는 일정을 만들어내지 마세요.",
  "- 제출 전에 문서의 일정 개수와 제출 건수를 스스로 대조해, 병합한 쌍 외에는 누락이 없는지 확인하세요. 특히 12월 말~2월과 각 칸의 마지막 항목을 다시 확인하세요.",
  "- documentDateCount에는 문서에 적힌 학교 일정 줄(항목)의 총 개수를 병합·분리하기 전 원본 기준으로 정확히 세어 넣으세요. 이 숫자는 누락 여부를 검증하는 데 쓰이므로 추측하지 말고 실제로 세야 합니다.",
  "- 추출한 전체 일정을 반드시 save_schedules 도구로 한 번에 제출하세요.",
].join("\n");

// C2 — 일정 수정(revise) 모드: 현재 일정 전체 + 수정 요청 → 수정 반영된 "전체" 목록 재제출
function extractionSystemPrompt(academicYear: number, startMonth: number, prompt = SYSTEM_PROMPT): string {
  const year = Number.isInteger(academicYear) && academicYear >= 2000 && academicYear <= 2200 ? academicYear : 2027;
  const month = Number.isInteger(startMonth) && startMonth >= 1 && startMonth <= 12 ? startMonth : 3;
  const endYear = month === 1 ? year : year + 1;
  const endMonth = month === 1 ? 12 : month - 1;
  const endDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  const mapping = month === 1
    ? `1~12월은 ${year}년`
    : `${month}~12월은 ${year}년, 1~${endMonth}월은 ${endYear}년`;
  return prompt.replace(
    "학사연도 2027-03-01 ~ 2028-02-29 틀로 추출합니다. 파일에 적힌 연도와 무관하게 3~12월은 2027년, 1~2월은 2028년으로 매핑하세요(월·일은 문서 그대로).",
    `학사연도 ${startDate} ~ ${endDate} 틀로 추출합니다. 파일에 적힌 연도와 무관하게 ${mapping}으로 매핑하세요(월·일은 문서 그대로).`,
  );
}

const SAVE_SCHEDULES_TOOL: Anthropic.Tool = {
  name: "save_schedules",
  description: "추출한 학사일정 목록을 제출합니다.",
  input_schema: {
    type: "object",
    properties: {
      // 260731 — PDF에도 누락 감지를 걸기 위한 필드. 서버가 본문을 직접 읽는 텍스트 형식과 달리
      // PDF는 통째로 모델에 넘겨 서버가 날짜를 셀 수 없으므로, 모델이 센 개수를 받아 대조 기준으로 쓴다.
      documentDateCount: {
        type: "integer",
        description: "문서에서 발견한 학교 일정 '줄(항목)'의 총 개수. 병합·분리 전 원본 기준으로 세세요.",
      },
      schedules: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "시작일 YYYY-MM-DD" },
            endDate: { type: "string", description: "종료일 YYYY-MM-DD (기간 일정만)" },
            // 260803 QA 회귀 지적 — 서버가 "원본에 종료 표기가 있었는지"를 알아야
            // 종료 표기 없는 '주간'만 금요일로 보정하고, 명시된 주말 종료일은 보존할 수 있다.
            endExplicit: {
              type: "boolean",
              description:
                "원문에 '이 일정 자체'의 종료 표기(예: (~18), (31~4.4일), (3/9~13), 시작/종료 행 쌍)가 있으면 true, 없으면 false. 옆 일정의 기간 표기는 해당 없음.",
            },
            label: { type: "string", description: "일정 이름" },
            category: { type: "string", enum: ["exam", "vacation", "event", "custom"] },
          },
          required: ["date", "label", "category", "endExplicit"],
        },
      },
    },
    required: ["documentDateCount", "schedules"],
  },
};

/** 수정(revise) 전용 도구 — 260804 김예슬님 [수정] 실패 대응.
 *  수정 모드는 "현재 일정 전체"를 그대로 다시 내보내는 구조라 항목당 필드 하나가 출력 토큰
 *  전체에 곱해진다. endExplicit·documentDateCount는 수정 모드에서 쓰이지 않는데도 필수라
 *  151건짜리 학교에서 응답이 30초를 넘겨 실패했다 → 수정 모드에서는 두 필드를 제거한다. */
function errorResponse(status: number, code: AiErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

/** 안전장치(260731) — 추출 텍스트에서 날짜 표기 개수를 추정한다.
 * AI가 학사 항목을 통째로 빼는 오판 모드(56행→35건)를 서버가 스스로 감지하기 위한 기준값.
 * 표기 혼용 문서에서 합산하면 이중 계산되므로, 패턴별 개수 중 최댓값을 쓴다(보수적 하한). */
function estimateDateCount(text: string): number {
  const patterns = [
    /\b20\d{2}[-./]\s?\d{1,2}[-./]\s?\d{1,2}\b/g, // 2027-03-02 · 2027.3.2 · 2027/3/2
    /\d{1,2}\s*월\s*\d{1,2}\s*일/g, // 3월 2일
    /(?<![\d.\/-])\d{1,2}\s*\/\s*\d{1,2}(?![\d.\/-])/g, // 3/2 (연도 생략 표기)
  ];
  let best = 0;
  for (const p of patterns) best = Math.max(best, (text.match(p) ?? []).length);
  return best;
}

function fileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/* ── G4: 파일 형식 확장 — 엑셀·워드·한글(hwpx) → 텍스트 추출 ──────────
 * 추출한 평문을 기존 csv/txt와 동일하게 텍스트 블록으로 Claude에 전달한다(추출 로직만 형식별로 분기). */

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => XML_ENTITIES[n] ?? _);
}

/** 엑셀(xlsx/xls) → 모든 시트를 CSV 텍스트로 병합 (sheetjs) */
async function extractSheetText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const wb = read(buf, { type: "buffer" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const csv = utils.sheet_to_csv(wb.Sheets[name]);
    if (csv.trim()) parts.push(`# 시트: ${name}\n${csv}`);
  }
  return parts.join("\n\n");
}

/** 워드(docx) → 본문 raw 텍스트 (mammoth) */
async function extractDocxText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

/** 한글(hwpx=OWPML zip) → Contents/section*.xml 본문 텍스트 추출 (jszip) */
async function extractHwpxText(file: File): Promise<{text: string; sourceLines: string[]}> {
  const buf = Buffer.from(await file.arrayBuffer());
  const zip = zipXml(buf);
  const sections = [...zip.keys()].filter(name => /^Contents\/section\d+\.xml$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const parts: string[] = [];
  // 260805 조은영 님 지적(날짜 밀림) 대응 — 표를 셀 좌표로 복원해 **날짜를 코드가 확정**한다.
  //   왜: 한국전통문화고 양식은 날짜 앞뒤에 월·주차·수업일수 칸이 붙어 있어, 표를 텍스트로
  //   평탄화하면 어느 숫자가 날짜인지 AI가 세다가 밀린다(3월 10건 중 6건 오류, 5건이 금요일).
  //   ⚠ 확신이 없으면 아무것도 하지 않는다 — gridBlocks 가 비면 기존 동작 그대로다.
  const gridBlocks: string[] = [];
  for (const name of sections) {
    const xml = zip.get(name)!;
    const grid = parseHwpxCalendarGrid(xml);
    if (grid.ok) gridBlocks.push(formatGridHits(grid.hits));
    for (const [, paragraph] of xml.matchAll(/<hp:p\b[^>]*>([\s\S]*?)<\/hp:p>/g)) {
      const text = [...paragraph.matchAll(/<hp:t\b[^>]*>([\s\S]*?)<\/hp:t>/g)]
        .map(([, run]) => decodeXmlEntities(run.replace(/<hp:lineBreak\s*\/>/g, "\n").replace(/<[^>]+>/g, "")))
        .join("");
      parts.push(...text.split("\n").filter(line => line.trim()));
    }
  }
  if (gridBlocks.length > 0) {
    // 날짜가 확정된 목록을 원문보다 **앞**에 두고, 이 날짜를 그대로 쓰라고 명시한다.
    // 일정명·분류 판단은 그대로 AI 몫이다("읽는 일은 AI, 세는 일은 코드" — 2026-08-05 방실장님 확정).
    return {sourceLines: parts, text: [
      "[표에서 날짜가 확정된 학사일정 목록]",
      "아래 목록의 날짜(M/D)는 원본 표의 칸 위치로 확정한 값입니다.",
      "이 목록에 있는 항목은 날짜를 그대로 사용하고, 각 줄의 내용에서 일정명과 분류만 판단하세요.",
      "날짜를 다시 계산하거나 조정하지 마세요.",
      gridBlocks.join("\n"),
      "",
      "[원본 문서 전체 텍스트 — 위 목록에 없는 일정을 찾을 때 참고]",
      parts.join("\n"),
    ].join("\n")};
  }
  return {sourceLines: parts, text: parts.join("\n")};
}

/* ── 공용: 모델 호출(에러 매핑) + tool use 파싱 ─────────────── */

type ModelCallResult =
  | { ok: true; response: Anthropic.Message }
  | { ok: false; res: Response };

async function callSaveSchedules(
  apiKey: string,
  system: string,
  content: Anthropic.ContentBlockParam[],
  logTag: string,
  opts?: { fetcher?: typeof fetch },
): Promise<ModelCallResult> {
  const client = new Anthropic({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 0,
    fetch: opts?.fetcher,
  });
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // QA 2-2(260728 김예슬님) — "엑셀은 50건, PDF는 52건으로 인식된다"는 보고를 실측 검증한
      //   결과, 형식 차이가 아니라 **같은 파일을 같은 설정으로 돌려도 매번 결과가 달랐다**
      //   (실측: 34건 / 50건 / 34건). 원인은 temperature 미설정 — Anthropic 기본값 1.0이라
      //   창의성 샘플링이 켜진 채로 구조화 추출을 하고 있었다. 최악의 경우 일정의 40%가
      //   조용히 누락된다. temperature 0으로 고정하니 50건/50건/50건으로 안정화됐다
      //   (정답: 원본 56행 − 시작/종료 쌍 6건 병합 = 50건).
      temperature: 0,
      system,
      tools: [SAVE_SCHEDULES_TOOL],
      tool_choice: { type: "tool", name: "save_schedules" },
      messages: [{ role: "user", content }],
    });
    return { ok: true, response };
  } catch (err) {
    // 주의: APIConnectionTimeoutError는 APIError의 하위 클래스 — 타임아웃을 먼저 분기
    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      return {
        ok: false,
        res: errorResponse(504, "timeout", "분석 시간이 초과돼 중단됐어요. 다시 시도해 주세요."),
      };
    }
    if (err instanceof Anthropic.APIError) {
      const msg = String(err.message ?? "");
      if (err.status === 400 && /page|pdf/i.test(msg)) {
        return {
          ok: false,
          res: errorResponse(400, "pdf_too_long", "PDF 페이지 수가 너무 많아요. 학사일정 부분만 추려서 올려주세요."),
        };
      }
      if (err.status === 401 || err.status === 403) {
        console.error(`[${logTag}] Anthropic authorization rejected:`, err.status, err.name);
        return {
          ok: false,
          res: errorResponse(503, "ai_unavailable", "AI 분석을 사용할 수 없는 환경입니다."),
        };
      }
      console.error(`[${logTag}] Anthropic API error:`, err.status, err.name);
      return {
        ok: false,
        res: errorResponse(502, "extract_failed", "AI 분석 요청이 실패했어요. 잠시 후 다시 시도해 주세요."),
      };
    }
    console.error(`[${logTag}] unexpected error:`, err instanceof Error ? err.message : err);
    return {
      ok: false,
      res: errorResponse(502, "extract_failed", "AI 분석 요청이 실패했어요. 잠시 후 다시 시도해 주세요."),
    };
  }
}

/** 라우트 내부 전용 — 원본에 종료 표기가 있었는지(endExplicit)를 함께 나른다.
 * 응답 직전에 벗겨서 클라이언트 계약(ExtractedSchedule)은 바뀌지 않는다. */
type FlaggedSchedule = ExtractedSchedule & { endExplicit?: boolean };

/** 260805 방실장님 — 같은 일정이 날짜만 이어져 여러 조각으로 나뉘는 문제를 서버가 결정적으로 병합.
 *
 * 배경: 달력 격자형 원고는 주 단위로 행이 나뉘어, 주 경계를 넘는 시험 기간이 여러 칸에 반복
 * 표기된다(세현고 [3]기말고사: 11/17~20 · 11/21 · 11/24). AI가 이를 이어붙일지 각각 둘지
 * 매번 다르게 판단해 **같은 파일인데 총 건수가 133~153건으로 흔들렸다**(QA 8/3 보고 이후 지속).
 * 판단을 AI에 맡기지 않고 서버가 기계적으로 합쳐 결과를 고정한다.
 *
 * 규칙(방실장님 확정): 같은 이름의 일정이 날짜로 이어지면 하나의 기간으로 합친다.
 *   - **중간 빈 날이 토·일요일뿐이면 이어진 것으로 본다** — 학교 시험은 주말을 끼고 이어지는
 *     경우가 많은데, 주말 칸에는 일정을 적지 않아 그냥 끊으면 기간이 두 동강 난다.
 *   - **평일이 비어 있으면 별개 일정**으로 둔다 — 교직원연수처럼 격주로 반복되는 일정 보호.
 */
function mergeAdjacentSameLabel(schedules: FlaggedSchedule[]): FlaggedSchedule[] {
  const key = (s: FlaggedSchedule) => `${s.label.replace(/\s+/g, "")}|${s.category}`;
  const day = (iso: string) => new Date(`${iso}T00:00:00`);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  /** prevEnd 다음 날부터 nextStart 전날까지가 모두 토·일이면 true (공백이 없으면 당연히 true) */
  const gapIsWeekendOnly = (prevEnd: Date, nextStart: Date) => {
    const t = new Date(prevEnd);
    t.setDate(t.getDate() + 1);
    while (t < nextStart) {
      const w = t.getDay();
      if (w !== 0 && w !== 6) return false; // 평일이 비어 있으면 별개 일정
      t.setDate(t.getDate() + 1);
    }
    return true;
  };

  const groups = new Map<string, FlaggedSchedule[]>();
  for (const s of schedules) {
    const k = key(s);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  const out: FlaggedSchedule[] = [];
  for (const list of groups.values()) {
    const sorted = [...list].sort((x, y) => x.date.localeCompare(y.date));
    let cur: FlaggedSchedule | null = null;
    let curEnd: Date | null = null;
    /** 진행 중이던 구간을 종료일과 함께 확정해 결과에 담는다 */
    const flush = () => {
      if (!cur || !curEnd) return;
      const endIso = fmt(curEnd);
      cur.endDate = endIso === cur.date ? undefined : endIso;
      out.push(cur);
      cur = null;
      curEnd = null;
    };

    for (const s of sorted) {
      const st = day(s.date);
      const en = day(s.endDate && s.endDate >= s.date ? s.endDate : s.date);
      if (Number.isNaN(st.getTime()) || Number.isNaN(en.getTime())) {
        out.push(s); // 날짜를 해석할 수 없으면 건드리지 않는다
        continue;
      }
      if (cur && curEnd && gapIsWeekendOnly(curEnd, st)) {
        if (en > curEnd) curEnd = en; // 이어짐 — 종료일만 확장
        continue;
      }
      flush();
      cur = { ...s };
      curEnd = en;
    }
    flush();
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
  return out;
}

/** 260803 김예슬님 — '주간' 종료일 자동 보정 (요일 계산은 AI가 아니라 서버가 정확하게).
 * 고객 확정 규칙: "종료 표기가 없는 '주간'은 시작일이 속한 주의 금요일까지".
 * 260803 QA 회귀 지적 반영 — 원본에 종료 표기가 있는 건(endExplicit=true)은 토·일 마감이라도
 * 절대 건드리지 않는다(학생상담주간(31~4.4일) 등 실데이터 존재). 보정 대상은
 * "종료 표기가 없다"고 모델이 밝힌 건(endExplicit=false)뿐이다. 기준(금요일)은 고객 합의. */
function applyWeekRangeRule(schedules: FlaggedSchedule[]): void {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  for (const s of schedules) {
    if (!s.label.includes("주간")) continue;
    if (s.endExplicit === true) continue; // 원본에 명시된 종료일 — 주말이어도 그대로 보존
    const d = new Date(`${s.date}T00:00:00`);
    if (Number.isNaN(d.getTime())) continue;
    const dow = d.getDay(); // 0=일 … 5=금
    // endDate가 시작일과 같은 것도 "종료 표기 없음"으로 취급 (모델이 date=endDate로 채워 오는 경우)
    if (!s.endDate || s.endDate === s.date) {
      if (dow >= 1 && dow <= 4) {
        const f = new Date(d);
        f.setDate(f.getDate() + (5 - dow));
        s.endDate = fmt(f);
      }
      continue;
    }
    // 종료 표기가 없다는데 endDate가 채워져 온 경우(옆 일정 기간 전용 등) — 시작일과 같은 주의
    // 토·일로 끝나 있으면 그 주 금요일로 당긴다 (다음 주 이후로 이어지는 값은 건드리지 않음).
    const e = new Date(`${s.endDate}T00:00:00`);
    if (Number.isNaN(e.getTime())) continue;
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - ((dow + 6) % 7)); // 그 주 월요일
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // 그 주 일요일
    const edow = e.getDay();
    if ((edow === 0 || edow === 6) && e >= d && e <= weekEnd) {
      const f = new Date(weekStart);
      f.setDate(f.getDate() + 4); // 그 주 금요일
      if (f >= d) s.endDate = fmt(f);
      else s.endDate = s.date; // 금~일 시작인 주간이 주말에 끝나는 극단 케이스는 당일로
    }
  }
}

/** 모델이 보고한 "문서 내 일정 줄 수" — PDF처럼 서버가 본문을 못 읽는 형식의 대조 기준 */
function reportedDateCount(response: Anthropic.Message): number {
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "save_schedules"
  );
  const n = (toolUse?.input as { documentDateCount?: unknown } | undefined)?.documentDateCount;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** tool use 결과 파싱 + zod 검증 — 비정상 항목은 걸러내고, 형식 자체가 아니면 null */
function parseToolSchedules(
  response: Anthropic.Message,
  logTag: string,
): FlaggedSchedule[] | null {
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "save_schedules"
  );
  const rawList = (toolUse?.input as { schedules?: unknown } | undefined)?.schedules;
  if (!Array.isArray(rawList)) {
    console.error(`[${logTag}] no tool_use schedules in response, stop_reason:`, response.stop_reason);
    return null;
  }
  const schedules: FlaggedSchedule[] = [];
  for (const item of rawList) {
    const parsed = extractedScheduleSchema.safeParse(item);
    if (!parsed.success) continue;
    // zod가 계약 외 필드를 벗기므로, 서버 보정에만 쓰는 endExplicit은 원본에서 따로 집는다
    const endExplicit = (item as { endExplicit?: unknown }).endExplicit;
    schedules.push(
      typeof endExplicit === "boolean" ? { ...parsed.data, endExplicit } : parsed.data,
    );
  }
  return schedules;
}

export async function analyzeWithModel(file: File, requestedAcademicYear: number, requestedStartMonth: number, apiKey = process.env.ANTHROPIC_API_KEY, fetcher?: typeof fetch) {
  if (!apiKey) return errorResponse(503, "ai_unavailable", "AI 분석을 사용할 수 없는 환경입니다.");
  const ext = fileExtension(file.name);
  // 파일 → 콘텐츠 블록: PDF=document(base64), 나머지(csv·txt·xlsx·docx·hwpx)=추출 텍스트
  let fileBlock: Anthropic.ContentBlockParam;
  let hwpxSourceLines: string[] = [];
  let extractedText: string | null = null; // 안전장치 대조용 (텍스트 형식만)
  if (ext === "pdf") {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    fileBlock = {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    };
  } else {
    let text: string;
    try {
      if (TEXT_EXTENSIONS.has(ext)) text = await file.text();
      else if (SHEET_EXTENSIONS.has(ext)) text = await extractSheetText(file);
      else if (ext === "docx") text = await extractDocxText(file);
      else if (ext === "hwpx") ({text, sourceLines: hwpxSourceLines} = await extractHwpxText(file));
      else {
        return errorResponse(
          400,
          "unsupported_format",
          "지원하지 않는 형식이에요. 한글(hwpx)·엑셀(xlsx)·워드(docx)·PDF·CSV 파일로 올려주세요."
        );
      }
    } catch (err) {
      console.error(
        `[schedule-extract] 파일 파싱 실패 ext=${ext}:`,
        err instanceof Error ? err.message : err
      );
      return errorResponse(
        400,
        "unsupported_format",
        "파일을 읽는 중 문제가 생겼어요. 파일이 손상되지 않았는지 확인하거나 PDF로 변환해서 올려주세요."
      );
    }
    if (!text.trim()) {
      return errorResponse(
        400,
        "unsupported_format",
        "파일에서 글자를 찾지 못했어요. 이미지·표로만 된 파일이면 PDF로 변환해서 올려주세요."
      );
    }
    extractedText = text;
    fileBlock = { type: "text", text: `<학사일정 파일 내용>\n${text}` };
  }

  const preserveSource = ext === "pdf" || ext === "hwpx";
  const extractionPrompt = extractionSystemPrompt(
    requestedAcademicYear, requestedStartMonth, preserveSource ? SOURCE_TRANSCRIPTION_PROMPT : SYSTEM_PROMPT,
  );

  const extractContent: Anthropic.ContentBlockParam[] = [
    fileBlock,
    { type: "text", text: "이 파일에서 학사일정을 추출해 save_schedules로 제출하세요." },
  ];
  // 260807 방실장님 확정(개선 ①) — 같은 파일을 **2회 병렬로 읽고 합친다.**
  //   배경: 공휴일 필터로도 남던 잔여 변동성 — 학력평가 3/26이 회차에 따라 들어왔다
  //   빠졌다 했다(QA·PM 각 2회 실측). AI 읽기는 회차마다 조금씩 다를 수 있는데,
  //   같은 일정을 두 번 다 놓칠 확률은 곱으로 떨어진다(예: 10% → 1%).
  //   병렬 실행이라 소요 시간은 1회와 같고, 비용 2배는 방실장님 승인(2026-08-07).
  //   합집합 키는 "이름(공백 제거)+시작일" — 이미 있으면 1차 결과를 유지하고
  //   없는 것만 2차에서 보충한다(같은 일정의 종료일이 회차 간 다른 경우 1차 우선).
  const [result, result2] = await Promise.all([
    callSaveSchedules(apiKey, extractionPrompt, extractContent, "schedule-extract", { fetcher }),
    callSaveSchedules(apiKey, extractionPrompt, extractContent, "schedule-extract-2nd", { fetcher }),
  ]);
  // 1차 실패여도 2차가 성공했으면 그것으로 진행 — 둘 다 실패일 때만 에러
  let response: Anthropic.Message;
  if (result.ok) response = result.response;
  else if (result2.ok) response = result2.response;
  else return result.res;

  // tool use 결과 파싱 + zod 검증 (비정상 항목은 걸러내고, 전부 비정상이면 에러)
  const primary = result.ok ? parseToolSchedules(result.response, "schedule-extract") : null;
  const schedules2 = result2.ok ? parseToolSchedules(result2.response, "schedule-extract-2nd") : null;
  let schedules = primary ?? schedules2;
  const reviewWarnings: string[] = [];
  if (ext === "pdf") {
    reviewWarnings.push("PDF에서 판독한 일정입니다. 원본과 일정명, 날짜, 누락 여부를 비교해 주세요.");
    if (primary && schedules2) {
      const primaryKeys = new Set(primary.map(sourceRowKey));
      const secondKeys = new Set(schedules2.map(sourceRowKey));
      const disputed = new Map([...primary, ...schedules2].map(row => [sourceRowKey(row), row]));
      for (const [key, row] of disputed) {
        if (primaryKeys.has(key) && secondKeys.has(key)) continue;
        reviewWarnings.push(`PDF 판독 불일치로 보류: ${row.date}${row.endDate ? " ~ " + row.endDate : ""} ${row.label}`);
      }
      schedules = primary.filter(row => secondKeys.has(sourceRowKey(row)));
    } else {
      return errorResponse(502, "extract_failed", "PDF의 일정명과 날짜를 두 번 대조하지 못했어요.");
    }
  } else if (primary && schedules2) {
    supplement(primary, schedules2, preserveSource ? sourceRowKey : undefined);
  }
  if (ext === "hwpx" && schedules) {
    schedules = schedules.filter(row => {
      if (hwpxSourceLines.some(line => {
        const original = line.trim();
        return original === row.label || parseMonthlyScheduleLine(original)?.[5] === row.label;
      })) return true;
      reviewWarnings.push(`HWPX 원문에서 일정명을 확인하지 못해 보류: ${row.date} ${row.label}`);
      return false;
    });
  }
  //   ①서버 실측(estimateDateCount) — 텍스트 형식(hwpx·xlsx·docx·csv)에서만 가능
  //   ②모델 자가 보고(documentDateCount) — **PDF 포함 전 형식**. 260801 방실장님 지시
  //     "어떤 사유로도 오류가 없어야 한다"에 따라 PDF 사각지대를 덮기 위해 추가.
  // 발동 문턱 75%: 시작/종료 병합으로 줄어드는 정상 폭(~11%)보다 훨씬 낮을 때만 재분석한다.
  if (schedules && !preserveSource) {
    const serverSide = extractedText ? estimateDateCount(extractedText) : 0;
    const modelSide = reportedDateCount(response);
    const baseline = Math.max(serverSide, modelSide);
    if (baseline >= 5 && schedules.length < Math.ceil(baseline * 0.75)) {
      console.warn(
        `[schedule-extract] 누락 의심 → 재분석: got=${schedules.length}` +
          ` baseline=${baseline} (server=${serverSide} model=${modelSide})`
      );
      const retry = await callSaveSchedules(apiKey, extractionPrompt, extractContent, "schedule-extract-retry", { fetcher });
      if (retry.ok) {
        const retried = parseToolSchedules(retry.response, "schedule-extract-retry");
        if (retried) supplement(schedules, retried);
      }
    }
  }
  if (!schedules) {
    // QA 2-2(260728) — 일정이 많아 응답이 토큰 상한에서 잘린 경우는 원인이 다르므로 별도 안내
    if (response.stop_reason === "max_tokens") {
      return errorResponse(
        502,
        "extract_failed",
        "일정이 많아 한 번에 다 처리하지 못했어요. 학기·분기별로 나눠서 올려주시겠어요?"
      );
    }
    return errorResponse(502, "extract_failed", "AI 응답이 비정상이에요. 다시 시도해 주세요.");
  }
  if (schedules.length === 0) {
    // 260803 김예슬님 — 한국전통문화고 원고: 텍스트는 있으나(안내문뿐) 일정이 전부 이미지로
    // 삽입된 파일. 일반 "찾지 못했어요"로는 사용자가 원인을 알 수 없어 상황을 구분해 안내한다.
    if (extractedText && extractedText.length > 300 && estimateDateCount(extractedText) < 3) {
      return errorResponse(
        502,
        "extract_failed",
        "파일에서 글자는 읽었지만 학사일정을 찾지 못했어요. 일정이 이미지(그림)로 들어있는 원고로 보입니다 — 일정이 글자(표)로 입력된 파일이나 PDF로 변환해서 올려주세요."
      );
    }
    return errorResponse(502, "extract_failed", "파일에서 학사일정을 찾지 못했어요. 파일을 확인 후 다시 올려주세요.");
  }

  // 260803 — 종료 표기 없는 '주간' 일정을 서버가 결정적으로 금요일까지 확장 (요일 계산 정확성)
  // 260805 방실장님 — 주 경계로 조각난 같은 일정을 먼저 하나로 합친다(주말 공백 허용).
  // 병합을 먼저 해야 조각난 '주간' 일정도 온전한 기간으로 모인 뒤 아래 금요일 규칙을 받는다.
  // 260806 QA-606 — 법정 공휴일 제외는 여기서 **코드가** 판정한다(AI는 빼지 않고 전부 가져온다).
  //   병합·주간 확장보다 먼저 걸러야 공휴일이 다른 일정과 엮여 기간으로 늘어나지 않는다.
  if (preserveSource && reportedDateCount(response) > schedules.length) {
    reviewWarnings.push("원본 일정 줄 수와 판독 결과가 달라요. 가져오지 못한 일정이 있는지 확인해 주세요.");
  }
  const holidayDropped = schedules.filter((s) => isLegalHoliday(s.label)).length;
  schedules = schedules.filter((s) => !isLegalHoliday(s.label));

  if (!preserveSource) {
    schedules = mergeAdjacentSameLabel(schedules);
    applyWeekRangeRule(schedules);
  }

  // 서버 로그: 토큰 사용량 (비용 추적용 — 키/본문 미출력)
  if (holidayDropped > 0) {
    console.log(`[schedule-extract] 법정 공휴일 ${holidayDropped}건 제외(달력에 자동 표시됨)`);
  }
  console.log(
    `[schedule-extract] ok count=${schedules.length}` +
      ` in=${response.usage.input_tokens} out=${response.usage.output_tokens}`
  );

  const cleanSchedules: ExtractedSchedule[] = schedules.map(
    ({ endExplicit: _endExplicit, ...rest }) => rest,
  );
  // 260806 QA 제안 — 제외 건수를 응답에 실어 사용자 안내로 노출한다.
  //   원고가 재량휴업일을 그냥 "휴일"로 적어 잘못 걸러지는 드문 경우,
  //   이 안내가 사용자가 알아챌 수 있는 유일한 신호다(유실은 침묵한다).
  const body: ScheduleExtractResponse = {
    ...summarizeSchedules(cleanSchedules),
    schedules: cleanSchedules,
    holidayExcluded: holidayDropped,
    ...(preserveSource ? {reviewWarnings} : {}),
  };
  return Response.json(body);
}

function sourceRowKey(row: FlaggedSchedule) {
  return JSON.stringify([row.date, row.endDate || row.date, row.label]);
}

function supplement(
  current: FlaggedSchedule[],
  extra: FlaggedSchedule[],
  key = (entry: FlaggedSchedule) => JSON.stringify([entry.date, entry.label.replace(/\s+/g, "")]),
) {
  const seen = new Set(current.map(key));
  for (const entry of extra) {
    if (seen.has(key(entry))) continue;
    seen.add(key(entry));
    current.push(entry);
  }
}

