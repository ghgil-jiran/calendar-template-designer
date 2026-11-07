# Update Apply Guide

AI가 starter 기준 확인 또는 안전 반영이 필요하다고 판단했을 때 따르는 내부 절차입니다.

세션 시작 시 SessionStart 훅이 자동으로 최신 기준을 확인한다. 오래됐으면 AI는 첫 응답에서 원래 요청을 처리하기 전에 예/아니오로 먼저 물어보고("업데이트가 있어요, 지금 반영할까요?"), "네"일 때만 아래 "2. 반영하는 경우" 절차를 진행한다. "나중에"면 반영하지 않고 원래 요청만 처리한다.

## 1. 확인만 하는 경우

확인만 필요한 경우 파일을 수정하지 않습니다.

```bash
npm run schoolp:update:check
```

확인 후 아래 항목만 보고합니다.

- 현재 프로젝트 Standard
- 최신 starter Standard
- 반영 후보 Standard
- `required`, `recommended`, `optional`, `breaking` 분류
- 자동 반영 가능 항목
- 개발자 확인 필요 항목

## 2. 반영하는 경우

starter 기준 안전 반영이 필요한 경우에만 안전한 항목을 반영합니다.

절차:

1. `npm run schoolp:update:check` 실행
2. 현재 프로젝트의 `AI_START_HERE.md`, `STARTER_VERSION.md`, `CHANGELOG.md`, `AI_COMMANDS.md`, `docs/UPDATE_POLICY.md` 확인
3. 다운로드 페이지 또는 manifest의 최신 기준 확인
4. 변경 대상과 제외 대상을 먼저 짧게 정리
5. 문서, 실행 스크립트, 배포 기준, 안전 규칙만 반영
6. **커맨드 스킬·훅·설정 파일 복사**: `.claude/skills/`·`.agents/skills/` 폴더 전체(모든 `schoolp-*` 스킬과 `frontend-design`), `.claude/settings.json`, `.codex/hooks.json`, `scripts/schoolp-*.mjs`를 현재 프로젝트에 없거나 오래됐으면 새 것으로 복사한다. 이건 문서가 아니라 **폴더 통째로** 가져와야 슬래시 커맨드가 생긴다. 복사 후 Claude Code는 세션을 재시작(또는 `/reload`)해야 `/schoolp-*` 커맨드가 목록에 뜬다.
7. 기존 UI, 스타일, 기능 파일은 수정하지 않음. **`src/app/globals.css`와 `tailwind.config.ts`는 덮어쓰지 않는다.** starter의 디자인 토큰은 팀원이 "디자인 토큰 반영해줘"라고 요청할 때만 반영하고, 그때 `.schoolp/starter-state.json`에 `"styleContract": "tokens-v1"`을 넣어 검사를 켠다. 그 전까지 `npm run style:check`는 토큰 관련 항목을 **경고로만** 출력하고 통과한다(기존 프로젝트의 `dev`/`build`가 막히지 않게 하기 위함)
8. `.schoolp/starter-state.json`과 `STARTER_VERSION.md`의 Standard 갱신. 기존 프로젝트에서 starter의 `starter-state.json`을 통째로 복사하면 `styleContract`가 딸려 들어가 `dev`/`build`가 즉시 막히므로, `appliedStandard`만 갱신한다
9. `WORK_LOG.md`에 반영 내용 기록
10. `npm run style:check`와 `npm run build`로 검증
11. 무엇을 반영했고 무엇을 건너뛰었는지 파일 목록으로 보고

## 3. 절대 하지 않는 작업

- starter ZIP을 현재 프로젝트에 통째로 덮어쓰기
- **이미 화면이 있는 프로젝트에 starter의 `src/**`를 복사하기** — `src/app/page.tsx`가 들어가면 루트 라우트를 예제 화면(신청 관리)이 가로챈다. `layout.tsx`·`globals.css`·`components/ui`·`features`·`api`도 마찬가지다. 빈 폴더에서 새로 시작할 때만 생성한다
- starter 다운로드 페이지의 UI를 실제 앱에 적용하기
- 기존 화면을 새 레이아웃, 헤더, 탭, 네비게이션으로 교체하기
- 기존 CSS나 Tailwind 구성을 starter 기준으로 덮어쓰기
- 기능 구현 파일을 업데이트 명목으로 재작성하기
- DB schema, migration, API route, 인증/결제/개인정보 코드를 임의 수정하기
- package dependency를 개발자 확인 없이 추가하거나 major 변경하기

## 4. 보고 형식

업데이트 반영 후에는 짧게 보고합니다.

```text
적용 기준: 현재 revision -> 최신 revision
반영 파일:
- ...
보존한 영역:
- 기존 UI/스타일/기능
검증:
- npm run style:check
- npm run build
개발자 확인 필요:
- 없음 또는 항목 기재
```
