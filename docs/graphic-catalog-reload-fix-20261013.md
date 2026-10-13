# 그래픽 라이브러리 재조회 오류 · 2026-10-13

- Preview 실행 로그: 03:20:23Z 및 03:20:54Z GET /api/template-assets 처리 중 graphic-storage-failed POST object status 400.
- 책·연필 배경의 graphic-asset-installation.v1 기록을 listGraphicRecords 허용 목록에서 누락. 이후 재조회에서 설치 완료를 인식하지 못하고 완료 기록을 중복 생성.
- 해당 기록을 내부 목록에서 보존하고 사용자 자산 목록에는 노출하지 않도록 수정.
- Supabase 중복 응답 HTTP 400 + error Duplicate도 기존 데이터 조회로 처리. 다른 400 오류는 실패 유지.
- 회귀 검증: 누락된 코드로 목록 재조회 실패 재현, 수정 코드 반복 조회 성공, 400 Duplicate 동시 등록 상황 처리, 자산 삭제 후 재생성 방지.
- 관련 13개 통과, 전체 build 및 Studio 858개 통과. 기존 원본/등록 자산 삭제 없음. Preview만 배포.
