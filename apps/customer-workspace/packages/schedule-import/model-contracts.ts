// AI 자료수집 API 계약 — /api/ai/schedule-extract · /api/ai/chat 공용 타입/검증
// 서버 라우트와 화면(ai-chat)이 같은 스키마를 공유한다. (zod 단일 소스)
// 참고: src/lib/calendar/schema.ts 의 scheduleSchema(source:"user")가 최종 소비처 —
// 여기서는 에디터 인계 전 "추출 결과" 단계의 축소 스키마만 정의한다 (스키마 수정 금지 원칙).
import { z } from "zod";

/* ── 추출 일정 항목 ─────────────────────────────────────────── */

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "YYYY-MM-DD" });

export const extractedScheduleSchema = z.object({
  date: ymd,
  endDate: ymd.optional(),
  label: z.string().min(1),
  category: z.enum(["exam", "vacation", "event", "custom"]),
});
export type ExtractedSchedule = z.infer<typeof extractedScheduleSchema>;

export const extractedScheduleListSchema = z.array(extractedScheduleSchema);

/* ── 분석 카드 표시용 요약 (명세 §3.3 ③ 카드 구조 유지) ───────── */

export type ScheduleAnalysis = {
  total: number;
  byType: { label: string; count: number }[];
  samples: { date: string; title: string }[];
};

export type ScheduleExtractResponse = ScheduleAnalysis & {
  schedules: ExtractedSchedule[];
  /** 260806 QA 제안 — 서버가 법정 공휴일로 판정해 제외한 건수. 사용자에게
   *  "공휴일 N건은 달력에 자동 표시되어 제외했어요"로 노출한다. 잘못 걸러진 경우
   *  (예: 재량휴업일을 그냥 "휴일"로 적은 원고) 사용자가 알아챌 수 있는 유일한 신호다. */
  holidayExcluded?: number;
};

export const CATEGORY_LABELS: Record<ExtractedSchedule["category"], string> = {
  exam: "시험",
  vacation: "방학",
  event: "행사",
  custom: "기타",
};

/** "2026-03-02" → "3/2", 기간이면 "4/28~30" 또는 "7/21~8/17" */
export function formatSampleDate(date: string, endDate?: string): string {
  const md = (s: string) => {
    const [, m, d] = s.split("-");
    return `${Number(m)}/${Number(d)}`;
  };
  if (!endDate || endDate === date) return md(date);
  const sameMonth = date.slice(0, 7) === endDate.slice(0, 7);
  return sameMonth ? `${md(date)}~${Number(endDate.slice(8))}` : `${md(date)}~${md(endDate)}`;
}

/** 추출 일정 배열 → 카드 표시용 요약 (byType 순서: 시험·방학·행사·기타) */
export function summarizeSchedules(schedules: ExtractedSchedule[]): ScheduleAnalysis {
  const counts: Record<ExtractedSchedule["category"], number> = {
    exam: 0,
    vacation: 0,
    event: 0,
    custom: 0,
  };
  for (const s of schedules) counts[s.category] += 1;

  const byType = (Object.keys(CATEGORY_LABELS) as ExtractedSchedule["category"][])
    .filter((c) => counts[c] > 0)
    .map((c) => ({ label: CATEGORY_LABELS[c], count: counts[c] }));

  const samples = schedules.slice(0, 5).map((s) => ({
    date: formatSampleDate(s.date, s.endDate),
    title: s.label,
  }));

  return { total: schedules.length, byType, samples };
}

/* ── 에러 응답 계약 ─────────────────────────────────────────── */

export type AiErrorCode =
  | "ai_unavailable" // API 키 없음 등 — 화면은 mock 폴백 + "AI 오프라인" 배지
  | "unsupported_format" // xlsx/hwp 등 — "PDF로 변환해서 올려주세요"
  | "file_too_large" // 10MB 초과
  | "pdf_too_long" // PDF 페이지 과다
  | "extract_failed" // 응답 비정상(파싱/검증 실패)
  | "timeout" // 30초 초과
  | "bad_request";

export type AiErrorResponse = { error: { code: AiErrorCode; message: string } };

/* ── sessionStorage 키 (에디터 연동은 다음 기능에서 소비) ────── */

export const AI_COLLECTED_SCHEDULES_KEY = "ai-collected-schedules";

/** 방실장님 7/22 — AI수집에서 지은 프로젝트 이름. 에디터 최초 로드 시 기본 제목일 때만 1회 반영 후 삭제 */
export const AI_PROJECT_TITLE_KEY = "ai-project-title";

/**
 * 2026-07-25 — AI_PENDING 예약 버킷(localStorage, 문서 간 공유) 귀속 가드.
 * QA-401(2026-07-25 밤) 전까지는 /ai/chat 마운트 시점에 "1"을 남기는 tab 전체 표식이었으나,
 * 탭이 닫힐 때까지 지워지지 않아 자료수집을 끝내지 않고 이탈해도 "그다음 이 tab에서 여는
 * 아무 문서"가 잔여 데이터를 계속 주워 담는 3차 유출이 재현됐다. 지금은 [사용자가 실제로
 * 클릭한 "에디터로 이동" 버튼이 생성한 새 프로젝트 uuid] 그 자체를 값으로 저장한다 —
 * use-doc-store의 attributeAiCollection은 이 값이 지금 hydrate 중인 projectId와 정확히
 * 일치할 때만 귀속을 허용하고, 일치 여부와 무관하게 그 즉시 소비(삭제)한다. 즉 이 표식으로
 * 데이터를 받을 수 있는 문서는 오직 한 개, 사용자가 실제로 "에디터로 이동"을 눌러 만든
 * 바로 그 문서뿐이다. sessionStorage는 tab이 닫히면 자동 소멸하므로 "이탈 시 저장 안 됨"
 * 안내와도 여전히 의미가 일치한다.
 */
export const AI_PENDING_SESSION_KEY = "ai-pending-session-active";

/** 자료수집 화면에서 고른 정확한 Template Package 식별자. 새 문서 귀속 후 즉시 소비한다. */
export const SELECTED_TEMPLATE_SESSION_KEY = "calendar:selected-template.v1";

/**
 * 자료수집 화면에서 선택한 학사연도. 새 프로젝트 UUID와 함께 저장해 다른 문서가
 * 잘못 가져가지 못하게 하며, 에디터 진입 URL의 값과 교차 검증한다.
 */
export const SELECTED_ACADEMIC_YEAR_SESSION_KEY = "calendar:selected-academic-year.v1";

export const DEFAULT_ACADEMIC_YEAR = 2027;

/** URL·세션 입력을 문서 스키마 허용 범위의 정수 학사연도로 정규화한다. */
export function normalizeAcademicYear(
  value: string | number | null | undefined,
  fallback = DEFAULT_ACADEMIC_YEAR,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : fallback;
}

