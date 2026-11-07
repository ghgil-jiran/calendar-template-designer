# Supabase Workflow

이 문서는 schoolp starter에서 Supabase를 사용하는 기준입니다.

Supabase는 개발/검토용 저장소입니다. 운영 DB 종류는 AI가 확정하지 않습니다.

## 역할

- 저장 기능의 기본 프로토타입 DB는 Supabase Postgres입니다.
- 화면은 Supabase를 직접 호출하지 않고 Next.js `/api/*` route를 통해 접근합니다.
- Supabase 접근 코드는 `/api/*` route 내부 또는 서버 전용 모듈에 둡니다.
- 계약 타입은 `src/lib/api/contracts.ts`에 둡니다.
- migration, seed, env, 이관 문서를 남깁니다.

## Supabase CLI Runbook

저장 기능이 필요한 프로젝트는 Supabase CLI, 로그인, project link, env가 준비되어 있지 않아도 가능한 준비 절차를 진행합니다.

AI가 진행할 수 있는 작업:

1. Supabase CLI 설치 여부를 확인합니다.
2. CLI가 없으면 OS에 맞는 설치를 시도하거나 설치 안내를 진행합니다.
3. `supabase login`으로 인증 절차를 시작합니다.
4. `supabase init`으로 프로젝트 설정을 준비합니다.
5. Supabase project link가 없으면 `supabase link` 흐름을 진행합니다.
6. migration, seed, env 예시, Supabase client, `/api/*` route 연동을 작성합니다.
7. 개발/검토용 Supabase 프로젝트에 migration/seed를 적용합니다.
8. 테이블 목적, env key 목록, Storage/Auth/Realtime 사용 여부, 운영 전환 항목을 `HANDOFF.md`에 기록합니다.

팀원이 직접 해야 하는 작업:

- Supabase 계정 로그인/회원가입
- 브라우저 인증/2FA
- access token 입력
- organization/project 선택
- secret 값 입력
- 결제/요금제/region 선택이 필요한 경우 확인

## Supabase 웹 대시보드

Supabase에는 개발/검토용 DB 데이터를 웹에서 확인하는 Dashboard가 있습니다.

- Table Editor에서 테이블 데이터를 볼 수 있습니다.
- 권한이 있는 경우 Table Editor에서 개발/검토용 데이터를 입력·수정할 수 있습니다.
- 팀원이 "Supabase 열어줘", "DB 데이터 보여줘"라고 요청하면 `/schoolp-supabase` 스킬 기준으로 dashboard 또는 project 화면을 안내합니다.
- 브라우저 로그인, 2FA, organization/project 선택은 팀원이 직접 진행합니다.
- AI는 Supabase access token, service role key, secret 값을 채팅에 요구하거나 출력하지 않습니다.
- 이 화면은 개발/검토용 데이터 확인 화면입니다. 운영 DB 관리 화면으로 표현하지 않습니다.

## 기존 DB 구현 전환

기존 DB 구현이 있으면 바로 삭제하거나 덮어쓰지 않습니다.

먼저 아래 항목을 확인합니다.

- 기존 schema
- seed/sample data
- API route
- `src/lib/api/contracts.ts`
- 화면에서 사용하는 저장/조회/수정/삭제 흐름
- env 값
- 이관 문서

전환 시 화면과 계약 타입은 유지합니다. 저장소 구현만 Supabase Postgres 기준으로 교체합니다.

기존 DB 구현에서 사용하던 sample data는 Supabase seed로 옮깁니다. 기존 schema는 그대로 복사하지 않고, 현재 서비스 요구사항에 맞는 Supabase migration으로 다시 정리합니다.

전환 후에는 migration, seed, env 예시, 이관 문서를 남깁니다.

## 데이터 접근 규칙

- 화면 컴포넌트는 Supabase client를 import하지 않습니다.
- 브라우저에서 호출하는 저장/조회/수정/삭제 기능은 Next.js `/api/*` route를 통해 처리합니다.
- Supabase service role key를 사용하는 코드는 서버 전용 위치에만 둡니다.
- `/api/*` route와 화면은 `src/lib/api/contracts.ts`의 같은 계약 타입을 공유합니다.
- 운영 전환 시 화면과 계약 타입은 유지하고 `/api/*` route 내부 저장소만 운영 DB 구현으로 교체합니다.

## Auth / Storage / Realtime

Supabase Auth는 로컬 개발/검토 중 로그인 상태를 임시로 확인할 때만 사용합니다. 최종 member login과 회원 정보 연동은 schoolp member API 공식 문서를 기준으로 정리합니다. AI는 Supabase Auth로 운영 회원가입, 로그인, 권한 체계를 확정하지 않습니다.

Supabase Storage는 파일 업로드가 필요한 화면 검증에만 사용합니다. 대용량 인쇄 원본, 실제 고객 파일, 장기 보관 파일은 개발자 확인 없이 저장하지 않습니다.

Supabase Realtime은 기본으로 사용하지 않습니다. 여러 사용자가 같은 화면의 변경사항을 즉시 확인해야 하는 경우에만 사용합니다.

Supabase Auth, Storage, Realtime을 사용한 경우에는 사용 목적, 연결된 테이블/파일/화면, 운영 전환 시 확인할 항목을 `HANDOFF.md`에 남깁니다.

## Env / Secret Boundary

서비스키, client secret, API token, Supabase `service_role` key는 브라우저 코드에 노출하지 않습니다.

AI는 없는 key/secret/client 정보를 임의로 만들지 않습니다. 필요한 연동 정보는 개발자에게 별도로 전달받아야 합니다.

`.env.example`에는 필요한 env key 이름만 남기고 실제 값은 비워둡니다. `HANDOFF.md`에는 필요한 값, 전달받은 값, 아직 필요한 값을 구분해서 기록합니다.

## 운영 전환 Handoff

운영 전환 시 개발자는 schema, seed/sample data, 사용 흐름, 권한, 성능, 기존 시스템 연동 여부를 검토한 뒤 운영용 데이터베이스로 이관합니다.

AI는 운영 DB 종류를 임의로 확정하지 않습니다. 운영 전환 문서에는 필요한 테이블, 인덱스, API 계약, 데이터 이관 항목을 남깁니다.
