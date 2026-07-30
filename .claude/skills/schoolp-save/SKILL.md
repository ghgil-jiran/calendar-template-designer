---
name: schoolp-save
description: 현재 작업을 GitHub에 저장한다(이어서 작업하기 위한 저장). "작업 저장해줘", "커밋해줘", "GitHub에 저장해줘" 요청에 사용. 단 "저장해줘"만 단독으로 오면 먼저 확인 질문을 한다.
---

`AI_COMMANDS.md`의 "작업 저장해줘" 절차와 "GitHub 준비 자동화"를 그대로 따른다. 안전 가드를 반드시 지킨다:
- "저장해줘"만 단독이면 바로 저장하지 말고 "GitHub에 저장할까요?"처럼 먼저 확인한다.
- 저장소는 반드시 private. `.env*`·DB·`.next`·`node_modules`·ZIP·로그는 제외(`.env.example`은 가능).
- 저장 전 `WORK_LOG.md`를 갱신하고, 가능하면 `npm run style:check`·`npm run build`를 실행한다.
- 저장하면서 `WORK_CONTEXT.md`(이어하기 메모)도 지금 상태 기준으로 자동 갱신한다 — 오늘 한 일/현재 상태/다음 할 일. 방식은 `schoolp-work-context` 기준이며 팀원이 따로 요청하지 않아도 된다.
