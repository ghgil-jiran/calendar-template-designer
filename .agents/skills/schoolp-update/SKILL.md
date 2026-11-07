---
name: schoolp-update
description: schoolp starter 최신 기준 확인 또는 안전 반영이 필요할 때 사용. "최신 기준 확인해줘", "스타터 업데이트 해줘", "기준 반영해줘" 요청에 사용.
---

starter 기준을 확인하고, 필요한 경우 기존 화면·기능·스타일을 보존하며 부족한 기준만 반영한다.

- 먼저 `STARTER_VERSION.md`, `CHANGELOG.md`, `starter-manifest.json`, `docs/UPDATE_POLICY.md`, `docs/UPDATE_APPLY_GUIDE.md`를 읽는다.
- 확인만 요청받으면 `npm run schoolp:update:check`로 차이만 보고하고 파일은 수정하지 않는다.
- 반영 요청이면 `docs/UPDATE_APPLY_GUIDE.md`의 safe-apply 절차를 따른다.
- 앱 화면, 스타일, 기능, 기획문서는 덮어쓰지 않는다.
- `.claude/skills`, `.agents/skills`, hooks, scripts, docs, manifest처럼 부족한 기준 파일만 비교해 보강한다.
- 반영 후에는 무엇을 바꿨는지 한 줄 요약하고, 필요한 경우 새 세션/재시작을 안내한다.

