# 월력 영역 고정 — 첫 단계

calendarLayout.fixedGeometry (monthly-grid-geometry.v1)에 기존 titlePercent, weekdayTrackMm, weekdayGapMm를 기록한다. 첫 편집 렌더링 시 기존 계산 결과를 그대로 보존한다. 표시 형식이나 요일 스타일 변경은 이 값에 영향을 주지 않는다. 기존 전체 월력 영역의 이동·크기 변경은 유지한다.

공통 shared-screen-calendar-layout.js가 에디터와 사용자 서비스에 동일하게 적용된다. calendarLayout은 기존 Runtime/스냅샷 변환에서 전달되므로 별도 사용자 서비스 좌표 보정 없음. 기존 저장본은 에디터에서 열고 저장하기 전까지 구형 계산으로 표시된다.

월 표시의 독립 개체·종류별 mm 기본값 설정·겹침 안내는 다음 단계. 현재 UI 선택은 기존 월력 Master를 유지한다. 인쇄 경로의 최종 정합 검증은 독립 개체 정의가 완료된 뒤 진행한다.
