# 관리자 교정 원본 이미지 업로드

2026-10-04 작업 기록. Production 변경 없이 Preview 브랜치에 반영한다.

## 관리자 흐름

제작 검수에서 검수를 시작하고 3단계 교정·재작업으로 이동한다. 이미지 개체를 선택해 새 원본을 업로드한다. 업로드 완료 후 교체 목록에서 파일을 선택하고 ‘변경 적용 · 미리보기’를 누른다. 변경 기록을 적고 새 교정 버전을 저장한다. 다시 접수 건을 열면 최신 교정본과 보관된 교정 원본을 조회한다.

- 사용자 접수 snapshot과 calendar-production-assets 원본은 변경하지 않는다.
- 새 원본은 별도 private bucket `calendar-correction-assets`에 보관한다.
- Storage overwrite는 허용하지 않는다. 준비 중 파일은 교정본에서 선택할 수 없다.
- JPEG/PNG/WebP, 파일당 최대 25MiB. 브라우저에서 이미지 읽기를 확인하고 서버에서 바이트 크기, 이미지 헤더의 형식·픽셀 크기와 SHA-256을 확인한다. 완전한 인쇄 품질 검증이 아니다.
- 교표 배경 제거·이미지 보정·업스케일은 자동 수행하지 않는다.
- 새 이미지 연결은 새 교정 버전에 저장한다. 기존 버전과 접수 원본은 보존한다.
- 추가 SQL 미적용이면 업로드만 비활성화하고 기존 교정본 편집은 유지한다.

## API 계약

Master Admin 인증 필수. API는 no-store.

`POST /api/production-correction-assets`

- prepare: `{requestId, action:'prepare', name, mimeType, byteSize}` → `{id, uploadUrl}`. URL은 해당 파일 한 개를 업로드하는 제한된 주소이며 서비스키를 포함하지 않는다.
- 브라우저는 반환된 주소로 파일을 PUT한다. 큰 파일을 Vercel JSON 요청 본문에 넣지 않는다.
- finalize: `{requestId, action:'finalize', assetId}` → `{asset}`. 서버에서 실제 보관된 파일을 확인하고 pending → ready로 저장한 뒤 임시 조회 주소를 반환한다.
- received/approved/sent 접수에는 새 업로드를 허용하지 않는다.

`GET /api/production-corrections?requestId=...`는 기존 revisions와 함께 ready assets 및 uploadAvailable을 반환한다. 원본 이미지 교체 서버 검증은 해당 접수의 사용자 원본 및 ready 관리자 원본만 허용한다. 다른 접수의 파일 ID는 사용할 수 없다.

## DB 적용

이전 교정본 SQL `202610030002_calendar_production_revisions.sql`을 적용한 프로젝트에서 새 SQL `202610040001_calendar_production_correction_assets.sql`을 한 번 적용한다. 기존 접수 SQL은 다시 실행할 필요가 없다.

테이블 `calendar_production_correction_assets`: 접수 번호·파일 경로·이름·형식·바이트 크기·pending/ready·픽셀 크기·파일 해시·등록 관리자·등록 일시. RLS 활성, 일반 사용자 접근 금지. ready 원본은 수정할 수 없다.

## 확인 범위와 남은 항목

이미지 파서/업로드 권한/접수 상태/크기·형식 불일치/원본 보존/버전 충돌 등 관련 테스트 25개 및 에디터 build 통과. 실제 Storage 업로드 → 교정본 저장 → 재조회는 새 SQL 적용 후 관리자 로그인 상태에서 확인해야 한다.

업로드 후 저장 없이 종료한 파일도 별도 원본 목록에 남는다. 업로드 중 실패한 pending 기록과 미연결 파일 정리 정책은 추후 관리 작업에서 정한다. 업로드용 제한 URL은 일반 이미지 조회 주소로 사용하지 않는다.

교정 버전 기준 해상도 재검사, CMYK/PDF-X4 출력 및 Worker·육안 승인 연결은 후속 작업이다. 운영 전환 시 파일 보존 기간·Storage 비용·워커 접근·SQL 권한과 원본 무변경 정책을 확인한다.
