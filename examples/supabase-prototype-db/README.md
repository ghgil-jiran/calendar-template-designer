# Supabase Prototype DB Example

기본 템플릿에는 활성 Supabase 프로젝트나 DB 연결 코드가 없습니다.

이 폴더는 저장 기능이 필요할 때 참고하는 예시입니다. 실제 서비스 요구사항과 `src/lib/api/contracts.ts` 계약에 맞춰 필요한 migration/seed/API route만 만듭니다.

기준:

- 데이터를 보여주는 화면은 항상 `/api/*` route를 거칩니다.
- 데이터가 새로고침 후에도 남아야 하면 Supabase Postgres로 실제 저장까지 만듭니다.
- 화면 컴포넌트는 Supabase client를 직접 import하지 않습니다.
- Supabase 접근 코드는 `/api/*` route 내부 또는 서버 전용 모듈에 둡니다.
- Auth, Storage, Realtime은 `docs/SUPABASE_WORKFLOW.md` 기준에 맞을 때만 사용합니다.
- 운영 DB 종류는 AI가 확정하지 않습니다.

사용 방식:

1. `docs/SUPABASE_WORKFLOW.md`를 읽습니다.
2. `src/lib/api/contracts.ts`에 계약 타입을 먼저 둡니다.
3. 필요한 table만 migration으로 작성합니다.
4. 검토용 sample data만 seed로 작성합니다.
5. `/api/*` route 내부에서 Supabase를 호출합니다.
6. env key와 운영 전환 항목을 `HANDOFF.md`에 기록합니다.

예시 파일:

- `migration.sql.example`: Supabase migration 예시
- `seed.sql.example`: Supabase seed 예시
- `route.ts.example`: Next.js Route Handler 예시
