---
name: schoolp-supabase
description: Supabase 웹 대시보드에서 개발/검토용 DB 데이터를 확인하거나 Table Editor를 열어야 할 때 사용. "Supabase 열어줘", "DB 데이터 보여줘", "Supabase 데이터 확인해줘" 요청에 사용.
---

Supabase 웹 대시보드는 개발/검토용 DB 데이터를 사람이 확인하는 화면이다.

- 먼저 `docs/SUPABASE_WORKFLOW.md`와 `.env.example`의 Supabase key 이름을 확인한다.
- Supabase project URL 또는 project ref가 있으면 `https://supabase.com/dashboard/project/<project-ref>` 또는 Supabase dashboard를 열도록 안내한다.
- 팀원이 브라우저에서 직접 로그인/회원가입/2FA/project 선택을 진행한다.
- 데이터 확인·입력·수정은 Supabase Dashboard의 Table Editor에서 진행할 수 있다고 안내한다.
- AI는 secret, service role key, access token 값을 채팅에 요구하거나 출력하지 않는다.
- 운영 DB로 착각하지 않게 "개발/검토용 Supabase 데이터"라고 표현한다.
- 운영 DB 종류, 운영 데이터 이관, RLS/권한 정책 확정은 개발자 확인 항목으로 남긴다.

