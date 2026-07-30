# v1.0 Beta QA Report

## 자동 검사

- Template Runtime TypeScript strict build
- Template Runtime 회귀 테스트
- RenderNode·RenderDiff 테스트
- Designer Runtime Integration strict build
- Legacy Adapter 통합 테스트
- Screen/SVG Publishing Renderer 테스트
- Designer Studio inline JavaScript 구문 검사
- 릴리스 ZIP 무결성 검사

## 수동 브라우저 확인이 필요한 항목

- 포인터 기반 이동·리사이즈·회전
- 이미지 업로드와 교체
- 전체 월력 Master 적용
- JSON 저장·재불러오기
- Runtime 미리보기와 Legacy 화면의 시각적 일치
- 인쇄 브라우저별 결과

## 판정

자동 검증 범위는 Public Beta 배포 기준을 통과한다. 전체 편집 Renderer 전환과 실제 PDF 바이너리 출력은 다음 릴리스 범위다.
