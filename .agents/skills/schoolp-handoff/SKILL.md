---
name: schoolp-handoff
description: 만든 화면과 기능을 실제 API·DB에 연결하고 운영으로 이어가기 위한 핸드오프 문서를 정리할 때 사용. "핸드오프 정리해줘", "핸드오프 문서 만들어줘", "전달할 내용 정리해줘" 요청에 사용.
---

핸드오프 문서를 `HANDOFF.md` 기준으로 정리한다.

- 먼저 `AI_START_HERE.md`, `docs/COLLABORATION_MODEL.md`, `docs/API_CONTRACT.md`, `docs/SUPABASE_WORKFLOW.md`, `HANDOFF.md`를 읽는다.
- 화면, `/api/*` route, `src/lib/api/contracts.ts`, Supabase migration/seed, env key, mock/real 연동 상태를 확인한다.
- secret 값은 출력하지 않는다. 필요한 key 이름과 전달받아야 할 값만 적는다.
- 운영 DB 종류, 공식 도메인, 사용자 공개 반영은 확정하지 않고 확인 항목으로 남긴다.
- 결과는 바로 전달할 수 있게 짧은 요약과 체크리스트 형태로 쓴다.
