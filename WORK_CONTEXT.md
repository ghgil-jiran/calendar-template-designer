# 현재 작업 — 2026-10-01

- 기준: preview/standard-page-settings-20260929 e0b17edf.
- 작업 브랜치: preview/admin-session-refresh-20261001.
- 관리자 인증: 만료 60초 전 자동 갱신, 화면 복귀 시 확인, 이미지·템플릿 저장 요청 전 확인.
- 동시 갱신 요청 통합. INVALID_SESSION 인증 거절 시 갱신 후 1회 재시도.
- 네트워크 갱신 실패 시 로그인 정보를 바로 지우지 않고 재시도. 만료 오류 안내 정정.
- npm run build 통과. 인증 회귀 테스트 3건 통과.
- Preview만 배포. Production 별도 승인 필요.
- 저장 실패 이후 원격·로컬 복구본 선택과 진행률 표시는 이번 변경 범위에서 제외.
- 기존 작업 폴더 /workspace/scratch/c14fd0108f38/editor-type-size 미커밋 변경 보존.
