# API Contract

공통 API 문서와 schoolp 공식 API 계약을 관리하는 문서입니다.

## schoolp 공식 API 계약

schoolp member/print 연동은 아래 공식 API 문서를 기준으로 합니다.

- member API v1: https://file.schoolp.co.kr/school/docs/schoolp-api-docs/member-v1/index.html
- print API v1: https://file.schoolp.co.kr/school/docs/schoolp-api-docs/print-v1/index.html

member API와 print API는 공식 계약 문서가 존재합니다.

AI는 member login, 회원 정보, 인쇄/주문/출력 관련 기능을 임의로 설계하지 않습니다. 해당 기능은 반드시 공식 API 문서의 endpoint, request, response, 인증 방식, 에러 형식을 기준으로 구현합니다.

각 API 호출에는 서비스키, client 정보, 허용 origin/IP, 테스트 계정, callback URL 등 별도 연동 정보가 필요할 수 있습니다. 이 정보는 AI가 임의로 만들거나 추측하지 않습니다. 필요한 값은 개발자에게 별도로 전달받아야 합니다.

AI는 필요한 env key 목록만 `.env.example`에 남기고 실제 값은 비워둡니다. 어떤 값이 필요한지, 어떤 값이 아직 전달되지 않았는지는 `HANDOFF.md`에 기록합니다.

## AI 필수 규칙

- 실제 API 연동은 이 문서에 공식 API 문서 URL 또는 endpoint 명세가 추가된 뒤에만 진행합니다. 단, schoolp member/print는 위 공식 문서를 우선합니다.
- 이 문서에 없는 endpoint, field, status, 인증 방식을 추측해서 만들지 않습니다.
- API 문서가 없을 때는 실제 연동을 하지 않습니다. 다만 화면에 데이터가 필요하면 컴포넌트에 값을 하드코딩하지 말고 `/api/*`에 타입이 붙은 목(mock) route를 만들어 그 데이터를 화면에 내려줍니다. 목 route는 실제 백엔드 연동이 아니라 화면 개발용 목 데이터이므로 이 규칙과 충돌하지 않습니다.
- 실제 회원, 상품, 주문, 결제, 개인정보, 권한, 파일 업로드 연동은 개발자 확인 전까지 구현하지 않습니다.

## 데이터 표시 / 목 route 규칙

- 데이터를 표시하는 화면은 데이터를 항상 `/api/*` route를 거쳐 받습니다. 컴포넌트/페이지에 인라인 목 배열을 두지 않습니다.
- 데이터가 남아야 하는 기능(저장/목록/관리자 데이터)은 목에 그치지 말고 목 route 내부를 Supabase Postgres로 만들어 실제 저장·조회되게 합니다(계약에 묶어 최소로). 이는 개발/검토용 프로토타입이며, 운영 API·DB는 개발자 검토 후 교체합니다. 자세한 기준은 `docs/SUPABASE_WORKFLOW.md`.
- 계약(데이터 모양) 타입은 `src/lib/api/contracts.ts`에 두고 route와 화면이 같은 타입을 공유합니다.
- 이 문서에 공식 API가 연결되면 화면과 계약 타입은 그대로 두고 목 route 내부만 실제 fetch로 교체합니다(seam 유지).
- 레퍼런스: `src/app/api/applications/route.ts`, `src/lib/api/contracts.ts`, `src/app/page.tsx`.

## API key / secret 규칙

서비스키, client secret, API token, Supabase `service_role` key는 브라우저 코드에 노출하지 않습니다. 서버 전용 secret은 Next.js `/api/*` route 또는 서버 전용 모듈에서만 사용합니다.

AI는 없는 key/secret/client 정보를 임의로 만들지 않습니다. 필요한 연동 정보는 개발자에게 별도로 전달받아야 합니다.

`.env.example`에는 필요한 env key 이름만 남기고 실제 값은 비워둡니다. `HANDOFF.md`에는 필요한 값, 전달받은 값, 아직 필요한 값을 구분해서 기록합니다.

## 이 문서 = 목→진짜 전환 스위치

협업 모델(`docs/COLLABORATION_MODEL.md`)에서 이 문서는 **스위치** 역할을 합니다.

- 처음에 합의한 계약(데이터 모양, `src/lib/api/contracts.ts`)이 곧 API 문서 역할을 하며, 팀원은 이 계약을 보고 목 route로 화면을 먼저 만듭니다.
- 개발자가 계약 뒤 백엔드+DB를 구현하고, 준비가 되면 **이 문서에 실제 API URL·endpoint 명세를 채웁니다.**
- 이 문서에 실제 명세가 채워지는 것이 "이제 목을 실제 연동으로 교체해도 됨"의 신호입니다. 그전까지는 목 route를 유지합니다.

## 문서 연결 예정

```text
Common API Docs URL:
Status: not ready
Owner: backend developer
```
