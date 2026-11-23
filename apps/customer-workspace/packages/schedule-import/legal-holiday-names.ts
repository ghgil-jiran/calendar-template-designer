// 법정 공휴일 제외는 AI 판단이 아니라 정확한 코드 목록으로 수행한다.
// 목록에 없는 재량휴업일·수능·학력평가·개교기념일은 학교 일정으로 보존한다.
export const LEGAL_HOLIDAY_NAMES = new Set([
  "신정", "새해첫날", "설날", "설날연휴", "설연휴", "구정",
  "삼일절", "3·1절", "31절", "삼일운동기념일",
  "어린이날", "부처님오신날", "석가탄신일", "초파일",
  "현충일", "광복절",
  "추석", "추석연휴", "한가위",
  "개천절", "한글날", "성탄절", "크리스마스",
  "대체공휴일", "대체휴일", "임시공휴일", "공휴일", "휴일",
  "일요일", "토요일",
  "설", "추석절", "기독탄신일", "석탄일",
  "선거일", "대통령선거", "전국동시지방선거",
]);

export function holidayKey(label: string): string {
  return label
    .replace(/[@$#&*※◆●▲■□○☆★]/g, "")
    .replace(/[()（）[\]]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function isLegalHoliday(label: string): boolean {
  return LEGAL_HOLIDAY_NAMES.has(holidayKey(label));
}

