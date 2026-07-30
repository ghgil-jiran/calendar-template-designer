---
name: schoolp-load
description: GitHub에 저장된 최신 작업을 현재 PC로 불러온다. "작업 불러와줘", "최신 작업 불러와줘", "이어서 작업하게 불러와줘", "GitHub에서 불러와줘" 요청에 사용.
---

`AI_COMMANDS.md`의 "최신 작업 불러와줘" 절차를 그대로 따른다.
- 저장 안 된 변경이 있으면 먼저 저장을 제안한다. `git fetch` 후 fast-forward 가능할 때만 `git pull --ff-only`.
- 충돌/divergent branch는 자동 해결하지 말고 상황을 설명한다. 가져온 뒤 `npm install` 필요 여부를 안내한다.
- 불러온 뒤 `WORK_CONTEXT.md`(이어하기 메모)가 있으면 먼저 읽고 "지난번 여기까지 했고, 다음은 이거예요"로 짧게 브리핑한 뒤 이어서 진행할지 확인한다.

불러온 뒤 `node scripts/schoolp-issue-check.mjs`로 개발자 확인 사항을 가져온다. 실패하면 그냥 넘어간다. 처리 기준은 `schoolp-save`와 같다.
