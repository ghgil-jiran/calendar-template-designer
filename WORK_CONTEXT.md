# 샘플 D v4
- 기존 v3 브랜치 기반, 28면 v4 데이터와 원본 PDF 포함.
- /apps/designer-studio/sample-d-save.html 에서 기존 관리자 인증 후 등록·저장 가능.
- /api/sample-d-installation POST start → document index 0..4 → save → verify.
- 테스트 2개 통과. 실제 저장은 아직 실행하지 않음.
- 임시 Preview 접근 링크 생성은 자동 승인 검토에서 추가 접근 승인 부재로 거절됨. 우회 금지.
- 다른 로컬 작업 디렉터리의 미커밋 변경은 포함하지 않음.

## 2026-11-16 샘플 A v3 디자인 수정
현재: v3 원본 ID 43205e86-a694-4f5f-9ae6-60d2ff45e915, versionId 9868c607-2c9f-4b21-90db-ff2f54bc0faf. 사용자 제공 검토 JSON의 실제 개체에 맞춰 수정 변환/인증된 적용 버튼 구현. PDF 배경·패키지·페이지·학교 자료 해시 보존. 주아 WOFF 번들 및 일정 8.5pt 렌더 opt-in. 실제 저장과 인쇄 검증은 사용자 실행 전. Preview 확인 후 관리자 적용; 자동 게시/Production 승격 금지.
검증: 관련 17개/스타일/정적 빌드/사용자 앱 빌드 통과. 기존 root 전체 검사는 버전 문자열/카탈로그 기대값 등 실패가 남음.

## 2026-11-17 V2 전환 착수
사용자 승인: 필요한 수정·저장·배포 준비 계속, 수동 Vercel/Supabase 설정 시 구체 안내. 기존 서비스 변경 최소화. feat/calendar-platform-v2에서 조사·독립 기반만 추가. 보존 브랜치 3개 생성(개발/에디터운영/고객운영). production 커밋은 docs/CALENDAR_PLATFORM_V2_BASELINE.json 참조. 신규 경계·조사 검사 6개 통과, style check 통과. 기존 앱 동작 변경·DB 쓰기·V2 배포 미실행. 샘플 A v3 자료는 28면·138 명시 개체, 현재 저장 초안은 미확인. 다음: 구버전 자산/DB 보존, 실제 Worker 저장소 식별, V2 데이터 쓰기 격리 및 검토 배포 구성.

## 2026-11-17 V2 매핑 후보와 저장 경계
두 V2 프로젝트의 3cc109b Production 배포 READY 확인(설정 분리이며 기능 전환 완료 아님). 원본 무변형 migration-candidate, 암묵 생성/미확정 역할 검토, 인쇄·게시 차단, 별도 자원 calendar_v2_migration_drafts의 revision 충돌 검사 추가. 기존 앱/API/DB 연결 미변경. 관련 11개 검사와 style 통과. 실제 Supabase 테스트 아님. 샘플 A v3 검토 자료 28면/138개/배경·장식17/역할검토40. 현재 초안과 원본 자산 미확인. V2 배포는 GitHub 자동 연동으로 확인. 다음은 실저장 DB 격리 위치 확정과 실제 최신 원본 확보.

## 2026-11-17 기존 Supabase 내 V2 테이블 결정
사용자 결정: 별도 프로젝트 대신 기존 Supabase의 V2 전용 테이블. 매핑 초안 1개 테이블 생성 migration과 read-only 확인 SQL 준비(미실행). 기존 테이블/Storage 변경 없음. 서버 전용 V2 변수 및 자원 allowlist transport 추가(기존 API 미연결). DB jsonb 키 순서에 안전한 원본 해시로 수정. 관련 14개 검사/style 통과, PostgreSQL 실실행 미검증. 다음 사용자 수동: 지정 SQL 하나만 SQL Editor에서 실행, 검증 결과 확인 후 인증 경로와 V2 변수 연결. 과거 migration 일괄 실행 금지.
