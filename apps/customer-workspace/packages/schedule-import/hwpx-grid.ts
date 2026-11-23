import {extractTables} from './hwpx-monthly-table.ts';

// HWPX 주간 달력의 셀 좌표를 사용해 월, 일, 일정 원문을 읽는다.
// 월 열은 주차 및 수업일수 열과 분리되며 요일 열은 헤더에서 찾는다.
export type GridDateHit = {
  /** 1~12 */
  month: number;
  /** 1~31 */
  day: number;
  /** 셀에서 선두 날짜 숫자를 뺀 나머지 원문 (여러 줄이면 줄바꿈 유지) */
  text: string;
};

export type GridParseResult =
  | { ok: true; hits: GridDateHit[]; tableIndexes: number[] }
  | { ok: false; reason: string };

const WEEKDAYS = ["월", "화", "수", "목", "금"] as const;

/**
 * 헤더 행에서 월·화·수·목·금 각각의 열 번호를 찾는다.
 *
 * ⚠ 연속 열이라고 가정하면 안 된다 — 한글 표는 셀 병합 때문에 한 요일이 여러 열을 차지한다.
 *   실측(한국전통문화고): 월=2, 화=5, 수=8, 목=11, 금=14 (3칸 간격)
 * "요일⏎월/주" 처럼 다른 글자가 섞인 셀은 정확히 "월"이 아니므로 자동으로 걸러진다.
 */
function findWeekdayColumns(row: string[]): number[] | null {
  const cols: number[] = [];
  let from = 0;
  for (const w of WEEKDAYS) {
    let found = -1;
    for (let c = from; c < row.length; c++) {
      if ((row[c] ?? "").trim() === w) {
        found = c;
        break;
      }
    }
    if (found < 0) return null; // 요일 하나라도 없으면 달력 격자가 아니다
    cols.push(found);
    from = found + 1; // 월→화→수→목→금 순서가 지켜져야 한다
  }
  return cols;
}

/** 셀 선두의 날짜 숫자를 뗀다. "25 119안전체험관(1)" → { day:25, rest:"119안전체험관(1)" } */
function splitLeadingDay(cell: string): { day: number; rest: string } | null {
  const m = /^\s*(\d{1,2})\s*\.?\s*([\s\S]*)$/.exec(cell);
  if (!m) return null;
  const day = Number(m[1]);
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  return { day, rest: m[2]!.trim() };
}

/**
 * hwpx section XML 에서 달력 격자표를 찾아 날짜를 확정한다.
 *
 * ok:true 조건 (하나라도 미달이면 실패 → 호출부는 기존 AI 경로 유지):
 *   1. 월~금 헤더가 순서대로 있다
 *   2. 그 아래에서 요일 열 선두가 날짜인 데이터 행이 3행 이상
 *   3. 각 행 안에서 날짜가 증가한다 (표가 밀리거나 깨지지 않았다는 신호)
 *   4. 날짜를 하나라도 건진 행이 전체 데이터 행의 절반 이상
 */
export function parseHwpxCalendarGrid(sectionXml: string, strict = false): GridParseResult {
  const tables = extractTables(sectionXml);
  if (tables.length === 0) return { ok: false, reason: "표 없음" };

  const all: GridDateHit[] = [];
  const usedTables: number[] = [];

  for (let t = 0; t < tables.length; t++) {
    const grid = tables[t]!;

    // 1) 요일 헤더 행 찾기
    let headerRow = -1;
    let dayCols: number[] = [];
    for (let r = 0; r < grid.length; r++) {
      const cols = findWeekdayColumns(grid[r]!);
      if (cols) {
        headerRow = r;
        dayCols = cols;
        break;
      }
    }
    if (headerRow < 0) continue;
    if (strict && !/월\s*[/·]\s*주/.test(grid[headerRow]?.[0] ?? "")) continue;

    // 2) 월(月) 열은 0번으로 고정한다.
    //    ⚠ "요일 열 왼쪽에서 1~12 정수를 아무거나 찾는" 방식은 쓰면 안 된다 —
    //      바로 옆 주차 열(4,5주 등)을 월로 오인한다(실측 버그).
    //    월이 세로 병합으로 한 번만 적히는 양식이 있어, 빈 행에서는 직전 월을 유지한다.
    const monthCol = 0;
    if (dayCols[0]! <= monthCol) continue; // 월 열이 요일 열보다 오른쪽이면 대상 아님

    const hits: GridDateHit[] = [];
    let dataRows = 0;
    let goodRows = 0;
    let month = 0;

    for (let r = headerRow + 1; r < grid.length; r++) {
      const row = grid[r]!;
      const monthLabel = (row[monthCol] ?? "").trim();
      if (/^(학년|수업일수)$/.test(monthLabel)) break;
      const monthMatch = /^(?:\d{2,4}년?\s+)?(1[0-2]|0?[1-9])월?$/.exec(monthLabel);
      const mv = Number(monthMatch?.[1]);
      if (Number.isInteger(mv) && mv >= 1 && mv <= 12) month = mv;

      const cells: { day: number; rest: string }[] = [];
      let increasing = true;
      let last = 0;
      for (const c of dayCols) {
        const cell = (row[c] ?? "").trim();
        if (!cell) continue;
        const split = splitLeadingDay(cell);
        if (!split) {
          if (strict && month) return {ok:false,reason:"날짜를 읽을 수 없는 요일 칸"};
          continue;
        }
        if (split.day <= last) increasing = false;
        last = split.day;
        cells.push(split);
      }
      if (cells.length === 0) continue;
      dataRows++;
      if (!increasing || month === 0) {
        if(strict) return {ok:false,reason:"월 또는 날짜 순서를 확인할 수 없는 행"};
        continue;
      } // 신뢰할 수 없는 행은 버린다(실패로 몰지는 않음)
      goodRows++;
      for (const { day, rest } of cells) {
        if (!rest) continue; // 일정 없는 날짜 칸
        hits.push({ month, day, text: rest });
      }
    }

    if (dataRows < 3) continue;
    if (goodRows * 2 < dataRows) continue;
    if (hits.length === 0) continue;

    // 학사일정 표가 상·하반기로 나뉜 양식이 있어 조건을 만족하는 표를 전부 합친다.
    all.push(...hits);
    usedTables.push(t);
  }

  if (all.length === 0) return { ok: false, reason: "달력 격자로 확신할 수 있는 표를 찾지 못함" };
  return { ok: true, hits: all, tableIndexes: usedTables };
}

/**
 * 확정된 날짜를 AI 프롬프트에 동봉할 텍스트로 만든다.
 * AI는 이 목록의 **날짜를 그대로 쓰고**, 각 줄의 내용에서 일정명·분류만 판단한다.
 */
export function formatGridHits(hits: GridDateHit[]): string {
  const lines = hits.map(({ month, day, text }) => `${month}/${day} ${text.replace(/\n/g, " / ")}`);
  return lines.join("\n");
}


