---
name: schoolp-verify
description: 작업 상태 점검, 빌드 확인, 배포 전 확인, 깨진 부분 확인이 필요할 때 사용. "점검해줘", "검증해줘", "문제 없는지 봐줘", "배포 전 확인해줘" 요청에 사용.
---

프로젝트가 계속 작업 가능한 상태인지 확인한다.

- 먼저 `AI_START_HERE.md`, `AI_COMMANDS.md`, `docs/VERCEL_DEPLOYMENT.md`, `docs/GITHUB_WORKFLOW.md`를 읽는다.
- 기본 확인: `npm run style:check`, `npm run build`.
- 가능하면 `npm run lint`, `npm run typecheck`도 실행한다.
- `/api/*`, `src/lib/api/contracts.ts`, Supabase migration/seed, env key 누락, 금지 파일(`.env*`, `.next`, `node_modules`, ZIP, DB 파일)을 확인한다.
- 실패하면 같은 명령을 반복하지 말고 원인을 분류한다: 코드 오류 / 스타일 보호 파일 / env 누락 / 인증·권한 / 개발자 확인 필요.
- 완료 보고는 통과/실패, 실행한 명령, 고쳐야 할 항목, 개발자 확인 필요 항목만 짧게 쓴다.

