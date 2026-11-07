# RC2 QA Report

## 통과

- HTML 내 모든 inline script 추출
- Node.js `--check` JavaScript 구문 검사 통과
- RC2 제품명과 런타임 릴리스 메타데이터 확인
- CalendarType 첫 실행 초기화 로직 정적 검토
- 기본 유형별 복수 크기 프리셋 정의 확인
- 시작 템플릿 필터 정의 확인
- 유형 관리자 닫기 시 Designer Studio 복귀 처리 확인

## 브라우저 자동화 제한

실행 환경의 Chromium 조직 정책이 로컬 파일 및 localhost 페이지를 차단하여 자동 클릭 기반 QA를 완료하지 못했다. 실제 배포 환경 또는 일반 Chrome에서 `docs/release/RELEASE-CHECKLIST.md`의 회귀 시나리오를 수행해야 한다.
