# Changelog

이 문서는 schoolp 시작 파일의 **기준(revision) 변경 내역**입니다. 모든 수정 횟수가 아니라, 팀원 프로젝트에 적용할 schoolp starter 기준이 실제로 바뀐 지점만 기록합니다. 문구 수정·다운로드 페이지 UI 조정·오타 수정처럼 기존 프로젝트에 다시 반영할 필요가 없는 변경은 revision을 올리지 않고 해당 기준의 Maintenance로 남깁니다.

기존 프로젝트에 이미 schoolp 기준을 적용한 경우에도 이 내역만 보고 판단하지 않습니다. 전체 구조와 현재 기준 문서를 다시 확인한 뒤 부족한 기준만 반영합니다.

> **이력 정리 (2026-07-03):** revision 이력을 배포 단위로 다시 묶었습니다. 같은 날 여러 번 올리던 것을 하나로 통합하고 번호를 `r001`~`r008`로 재정렬했습니다. AI는 표기 문자열이 아니라 manifest의 `revisionNumber`로만 비교합니다. 이전 세부 작업 이력은 `WORK_LOG.md`에 남아 있습니다.


## r015 · 2026-07-20 — 개발자 확인 사항(GitHub Issue) 수신·반영 경로

Level: required · Scope: collaboration, developer-review · Risk: low · Apply: docs, skills, scripts, hooks, manifest, state

- 개발자가 프로젝트를 주기적으로 검토하고 방향을 해당 저장소의 GitHub Issue로 남기면, 팀원 AI가 대신 확인하고 반영한 뒤 코멘트·닫기까지 처리합니다. 팀원은 이 경로를 몰라도 되고 새 커맨드도 배우지 않습니다(공식 요청 표 6개 유지).
- 확인 시점은 **작업을 시작하는 순간**뿐입니다: 세션 시작(SessionStart 훅) · `작업 불러와줘` 후. `작업 저장해줘`·`배포해줘` 전에는 붙이지 않습니다 — 대부분 퇴근 직전이거나 회의 직전이라 그 시점에 새 작업을 전달하면 처리할 시간이 없고 부담만 남습니다. `실행해줘`에도 붙이지 않습니다(가장 빈번한 명령이라 체감 속도가 나빠집니다).
- `scripts/schoolp-issue-check.mjs` 추가. **반드시 fail-open** — git 저장소가 아니거나 `gh` 미설치·미인증·네트워크 실패 시 조용히 넘어가고 팀원 작업을 멈추지 않습니다.
- 반영 기준: 팀원에게 GitHub·Issue 용어를 노출하지 않고 서비스 언어로 전합니다. 기술적 변경은 한 줄 알리고 진행, 팀원 눈에 보이는 변화(데이터 삭제·기능 제거 등)는 먼저 묻습니다. 결과를 코드로 확인했을 때만 Issue를 닫고, 일부만 처리했거나 판단이 필요하면 코멘트만 남깁니다.
- 같은 항목 재작업 방지: 조회 시 이전 처리 코멘트를 함께 가져옵니다. `[처리 기록]`이 붙은 항목은 이미 작업된 것으로 보고 남은 부분만 처리하며, 남은 일이 없으면 코멘트도 추가하지 않고 넘어갑니다. 닫지 않은 항목은 다음 확인 때 다시 나타나므로, 기록을 근거로 중복 작업하지 않습니다.
- 화면·기능·스타일 변경 없음.

## r014 · 2026-07-09 — 프론트엔드 품질 하네스(독창성+토큰 규율, 프리뷰 루프, 브라우저 완결 기능)

Level: required · Scope: frontend-quality, design-system, client-features · Risk: low · Apply: docs, skills, manifest, state, download-page

`AI_START_HERE.md`에 "프론트엔드 품질 기준" 섹션 신설. 잘 만드는 빌더가 "기본값으로" 예쁘게·기능적으로 뽑는 이유는 스택·디자인 규율·확인 루프를 하네스가 미리 깔아둔 것뿐이며, 그 역할을 스타터에 흡수.

- **디자인 — 독창성은 한 번, 규율은 매 화면** — 방향(팔레트·타이포·시그니처)은 서비스에 맞게 독창적으로 정하고(`frontend-design`), `globals.css`·`tailwind.config.ts` 토큰(CSS 변수·색은 HSL)에 박은 뒤 **모든 화면을 그 토큰 + `src/components/ui`(shadcn)로만** 만든다. 인라인 색상(`text-white` 등)·컴포넌트 즉흥 스타일 금지, 커스텀은 변형(variant)으로. 화려함은 표면 중요도에 맞춤(랜딩 과감·표/폼 관습적). "안전한 폴리시"와 "독창적 아이덴티티"를 층위로 결합
- **프리뷰 확인 루프** — UI를 만들거나 바꾼 뒤 로컬(`localhost:3000`)에서 실제 렌더·콘솔 오류를 확인하고 고친다("만들고 끝" 금지)
- **브라우저 기능 + 라이브러리 선택 기준** — 차트·드래그·필터·간단한 편집처럼 브라우저에서 바로 처리할 수 있는 기능은 필요한 범위까지 구현. 파일/PDF 내보내기는 정밀 출력·대용량·보안 요구에 따라 서버 처리가 필요할 수 있으므로 먼저 범위를 판단. 기존 스택 우선·필요한 라이브러리 하나만·검증과 유지 상태 확인·도입 전 한 줄 안내·맞지 않으면 제거
- `CLAUDE.md`·`AGENTS.md`에 요약 원칙 추가. 코드·화면·스타일 무변경(규칙만 추가)

Maintenance · 2026-07-10

r014에서 세운 "토큰 규율"이 실제로 지켜질 수 있도록 재료와 강제 장치를 채웠습니다. 기준(revision) 자체는 그대로이며, 새 프로젝트는 이 시작 파일을 받으면 자동으로 적용됩니다.

- **토큰 확장** — 표면 3층(`background`→`canvas`→`surface`), 역할별 브랜드 그림자(`shadow-panel`·`shadow-elevated`·`shadow-canvas`), `accent`/`accent-soft`/`border-strong`/`success`, 반경 `0.75rem`, 본문 서체(Pretendard). 색 토큰을 `hsl(var(--x) / <alpha-value>)`로 등록해 **투명도 수식어**(`border-border/60`, `bg-primary/85`)를 열었다 — 새 색을 늘리지 않고 층을 만드는 기본기이며 이전에는 동작하지 않았다
- **컴포넌트 변형 확충** — Button 변형 6종(+크기 4종), Badge 상태 변형(옅은 배경+링). 화면에서 `className`으로 색을 덮어쓸 이유를 없앴다
- **style guard가 실제로 강제** — 토큰 존재 확인에 더해 `src/**`를 훑어 인라인 색상(`text-white`·`bg-slate-100`·`bg-[#...]`)을 잡아 실패시키고, `<alpha-value>` 등록 누락도 잡는다
- **`frontend-design` 스킬에 "schoolp 실행 규율" 10개 항 추가**(`.claude`/`.agents`) — 코드보다 디자인 의도를 먼저 선언 → 토큰에 착지 → 화면 순서, 다크모드 만들지 않기, 모션은 시그니처 하나에, 컴포넌트는 variant로 확장
- 시작 화면(`page.tsx`·`application-browser.tsx`)을 새 토큰으로 다시 구성. 구조(목 route + 공유 계약 타입 + 화면에서 계산)는 그대로
- **문구와 도움말 정리** — 추상적인 자신감 표현을 구체적인 구현 범위와 라이브러리 선택 기준으로 바꾸고, 도움말은 공식 요청 표에 새 기능 요청법·질문 방법·자동 점검 안내를 짧게 덧붙이는 형태로 보강
- **핸드오프 파일 역할 정리** — 실제 연동·운영 전환 전달 문서는 `HANDOFF.md`, GitHub 저장·불러오기용 이어하기 메모는 `WORK_CONTEXT.md`로 분리. 공식 요청은 `핸드오프 정리해줘`(`/schoolp-handoff`)이며 `/schoolp-devnote`는 기존 프로젝트 호환용으로 유지

Maintenance · 2026-07-10 (2) — 기존 프로젝트에 기준이 반영되지 않던 문제 수정

기존 Next.js 프로젝트나 다른 구조의 프로젝트에서 요청 문구를 붙여넣었을 때 기준이 제대로 반영되지 않던 원인 세 가지를 고쳤습니다. 기준(revision)은 r014 그대로입니다.

- **style guard를 옵트인으로 분리** — 앞선 Maintenance에서 추가한 토큰 검사가 기존 프로젝트의 `dev`·`build`를 막고 있었다(두 명령이 `style:check`를 먼저 돌리는데, 통과하려면 `globals.css`를 고쳐야 하고 그 파일은 `manualReview`라 AI가 손댈 수 없어 교착). 이제 가드는 두 층이다 — ① 기본 계약(Tailwind 연결)은 항상 검사, ② 토큰 규율과 인라인 색상 금지는 `.schoolp/starter-state.json`의 `styleContract: "tokens-v1"`이 있을 때만 실패. 새 프로젝트는 켜진 채로 시작하고, 기존 프로젝트는 경고만 보다가 "디자인 토큰 반영해줘" 요청 시 켠다. 설정 파일 이름이 다른 프로젝트(`postcss.config.mjs` 등)도 막히지 않는다
- **`safeApply`에 스킬·설정·훅 추가** — `requiredDocs`는 26개 스킬을 요구하는데 자동 반영 허용 목록에는 `.claude/skills/**`·`.agents/skills/**`·`.claude/settings.json`·`.codex/hooks.json`이 없어서, 문서만 복사되고 `/schoolp-*` 커맨드가 생기지 않았다. `manualReview`에 `tailwind.config.ts`·`postcss.config.js`·`components.json`·`src/lib/api/**`를 명시. `.schoolp/starter-state.json`은 통째 복사 금지(`appliedStandard`만 갱신)로 바꿔 `styleContract`가 기존 프로젝트로 딸려가지 않게 했다
- **`src/**` 복사 금지를 명시** — 이미 화면이 있는 프로젝트에 starter의 `src/app/page.tsx`가 들어가면 루트 라우트를 예제 화면이 가로챈다. 지금까지 이걸 막는 규칙이 "기존 UI 변경 금지" 같은 추상적 문장뿐이었다. `forbiddenAutoApply`·`docs/UPDATE_APPLY_GUIDE.md`·`AI_START_HERE.md`·요청 문구 네 곳에 명시
- **요청 문구 보강** — `docs/UPDATE_APPLY_GUIDE.md`를 읽으라고 명시(폴더째 복사 지침이 거기에만 있었다). 스킬·설정·훅은 폴더째 복사, 기존 `src/`는 보존, 마지막에 반영/건너뛴 파일 목록 보고를 요청 문구에 포함

## r013 · 2026-07-09 — 커맨드 체계 정리(공식 6개·한국어 우선), 핸드오프·이어하기 메모 분리, 기획 보강 + 범위 규율

Level: required · Scope: commands, skills, docs · Risk: low · Apply: skills, docs, manifest, state, download-page

- **팀원 노출 커맨드를 한국어 문장 우선 + 공식 6개로 정리** — 실행/작업 저장/불러오기/배포/핸드오프/도움말. 팀원은 한국어로 말하면 되고 슬래시(`/schoolp-*`)는 보조(양쪽 도구 동일, 도구별 사용법 안내 제거). 점검(`/schoolp-verify`)·최신 기준 확인(`/schoolp-update`)·Supabase 열기(`/schoolp-supabase`)는 표에서 빼 필요할 때만 부르거나 자동 처리. `/schoolp-help`는 공식 요청 표와 짧은 사용 안내 제공
- **새 기능·화면은 명령이 아니라 설명** — 만들고 싶은 걸 말하면 AI가 기획 브레인스토밍(`/schoolp-brainstorm`)부터 자동 시작하므로 표에 명령으로 넣지 않음(스킬·직접 호출은 유지)
- **핸드오프와 이어하기 메모 분리** — "핸드오프 정리해줘"(`/schoolp-handoff`)는 `HANDOFF.md`를 정리. GitHub 저장·불러오기용 `WORK_CONTEXT.md`는 "작업 저장해줘" 때 자동 갱신되고 "작업 불러와줘" 때 자동 브리핑. `/schoolp-devnote`는 이전 버전 호환용 별칭으로 유지
- **기획 브레인스토밍 보강** — 큰 요청은 먼저 조각으로 쪼개기, 질문이 끝나면 접근안 2~3개를 추천과 함께 제시, 스펙 자가검토(빈칸·모순·모호·과대범위)
- **범위 규율(과잉개발 방지) 추가** — 안 시킨 화면·기능·리팩터·추상화·목업 하드닝은 얹지 않되, 빈/로딩/오류 상태·반응형·버그 수정 등 완성도는 줄이지 않음
- 코드·화면·스타일 무변경. 다운로드 페이지 뱃지 표기 정리(`BFF`, `Supabase (Postgres)`)

## r012 · 2026-07-09 — Supabase 개발/검토 저장소 표준 + 공식 API 계약 보강

Level: required · Scope: supabase-workflow, official-api-contract, cli-runbooks · Risk: medium · Apply: docs, examples, scripts, manifest, state, download-page

- **저장 기능 기본을 SQLite/Prisma에서 개발/검토용 Supabase Postgres로 전환.** 저장/수정/삭제·목록·관리자 데이터처럼 데이터가 남아야 하는 기능은 최소 Supabase migration/seed와 `/api/*` route 뒤에서 구현하고, UI는 Supabase를 직접 호출하지 않음
- `docs/SUPABASE_WORKFLOW.md` 신설: Supabase CLI 설치/로그인/프로젝트 연결, migration/seed/env, 기존 DB 구현 이관, Auth·Storage·Realtime 사용 기준, secret boundary, 운영 전환용 handoff 정리
- `docs/API_CONTRACT.md`에 schoolp member API v1·print API v1 공식 문서 우선 규칙 추가. 서비스키/client 정보는 개발자에게 별도 전달받고, 문서와 `.env.example`에는 key 이름만 남김
- GitHub/Vercel CLI runbook 보강: GitHub identity/visibility/unsafe ops, Vercel project identity/env boundary/postflight inspect/logs 기준 추가. Vercel 배포는 팀 공유용 화면 검토 링크로 표현
- Prisma/SQLite 예시 제거, `examples/supabase-prototype-db` 추가, Supabase migration/env 기준으로 저장 상태를 문서화

Maintenance · 2026-07-09

- 팀원용 커맨드 정리: `/schoolp-summary` 제거, `/schoolp-handoff`·`/schoolp-verify`·`/schoolp-update` 유지, Supabase 웹 대시보드(Table Editor) 확인용 `/schoolp-supabase` 추가
- DB/Supabase 구현과 공식 API 연동은 별도 팀원 스킬이 아니라 기능 구현 중 AI가 자동으로 따르는 기준으로 유지

## r011 · 2026-07-03 — 기획 브레인스토밍 하드 게이트 강화

Level: required · Scope: planning-hard-gate · Risk: low · Apply: docs, skills, manifest, state, download-page

- **기획 브레인스토밍(`schoolp-brainstorm`)을 superpowers식 하드 게이트로 강화.** 답을 다 받기 전엔 스펙·`contracts.ts` 계약·코드·파일 생성 **전부 금지**, **한 번에 질문 하나씩**, 답이 모호하면 보기를 제시해 확정될 때까지 되묻기, 모순된 가정은 짚어서 되묻기, 체크리스트가 채워지면 확인을 받은 뒤에만 산출물 생성. Codex가 질문 없이 곧장 구현/계획서로 넘어가던 문제 해결
- `.claude`/`.agents` 두 스킬 `SKILL.md`를 전면 재작성(금지 게이트를 **최상단**으로, "만든다" 표현을 뒤로 배치해 실행 편향 억제). `docs/PLANNING_ELICITATION.md`에 "절대 규칙 — 하드 게이트" 절 추가 + 질문 방식을 "한 번에 하나"로. `AI_START_HERE.md`·`CLAUDE.md`·`AGENTS.md`에 하드 게이트 원칙 추가
- 코드·화면·기존 UI 무변경. 기존 프로젝트 반영 시 스킬 폴더(`.claude/skills`·`.agents/skills`)와 docs·AI 문서만 복사하면 되고 새 세션에서 인식됨

Maintenance · 2026-07-08

- `docs/domain/`과 `07-db-schema.md`의 문서 권한을 보강: 기존 코드베이스 요약과 DB 스키마는 도메인 이해·연동 지점 확인용 참고자료이며, 신규 서비스의 화면 흐름·`/api/*` 목 계약·로컬 SQLite 스키마는 서비스 요구사항으로 새로 설계한다고 명시. 기존 DB 테이블·컬럼·enum을 그대로 복사하거나 신규 서비스를 레거시 구조에 맞춰 축소하지 않도록 `AI_START_HERE.md`·`AGENTS.md`·`CLAUDE.md`에도 같은 원칙 추가

## r010 · 2026-07-03 — 요청 진입 단일화 + 기획문서 기반 진행

Level: required · Scope: unified-entry, planning-doc-ingest · Risk: low · Apply: docs, skills, manifest, state, download-page

- **다운로드 페이지의 '새 프로젝트/기존 프로젝트' 두 모드를 하나의 요청 문구로 통합**. 팀원은 모드를 고르지 않고, AI가 현재 폴더 상태(빈 폴더 / 기획문서(md) / 만들다 만 화면 / 이미 돌아가는 앱 / 이미 schoolp starter 적용)를 스스로 판단해 그에 맞게 이어간다
- **기획문서 기반 진행**: 프로젝트에 기획문서(md 등)나 만들다 만 화면이 있으면 그것을 기획 기준(plan of record)으로 **먼저 읽고**, 백지에서 다시 묻지 않고 빠지거나 애매하거나 서로 안 맞는 부분만 확인한 뒤 스펙 + `contracts.ts` 계약 초안으로 정리해 이어서 구현. 만들던 화면·내용·기획문서는 보존
- `docs/PLANNING_ELICITATION.md`에 "이미 기획문서가 있으면 먼저 확인" 절 추가, `schoolp-brainstorm` 스킬(`.claude`/`.agents`)·`AI_START_HERE.md`·`CLAUDE.md`·`AGENTS.md`에 동일 분기 추가. `index.html` 요청 문구·규칙·AI 지시문·업데이트 모달 통합. 코드·화면 무변경(진행 방식 규칙만 변경)

## r009 · 2026-07-03 — frontend-design 공식 디자인 스킬 동봉

Level: required · Scope: frontend-design-skill · Risk: low · Apply: skills, manifest, state, download-page

- **Anthropic 공식 `frontend-design` 스킬 동봉**: 화면·UI를 새로 만들거나 다듬을 때 자동 적용되는 디자인 가이드. 팔레트·타이포·레이아웃을 "AI가 흔히 뽑는 템플릿틱한 기본값"에서 벗어나 이 브리프에 맞게 의도적으로 고르고, 한 가지 시그니처 요소에 힘을 준다. Claude Code(`.claude/skills/frontend-design`)·Codex(`.agents/skills/frontend-design`) 동일 내용 + `LICENSE.txt` 동봉
- **한국어 트리거 추가**("디자인 잘 만들어줘", "화면 예쁘게 해줘", "UI 다듬어줘", "랜딩페이지/대시보드 디자인"). 스킬 폴더만으로 인식되어 `/frontend-design` 슬래시로도 뜬다 — 별도 커맨드 파일 불필요
- 순수 설명글(가이드) 스킬이라 코드·화면·기존 UI 무변경. `requiredDocs`에 두 `SKILL.md` 경로 추가. 기존 프로젝트 반영 시 스킬 폴더만 복사하면 되고 **새 세션에서 인식**된다

## r008 · 2026-07-03 — 실측 운영 DB 스키마 문서

Level: required · Scope: domain-db-schema · Risk: low · Apply: docs, manifest, state, download-page

- 실제 운영 DB에서 뽑은 스키마(`mysqldump --no-data`, 42개 테이블, 데이터 제외)를 `docs/domain/07-db-schema.md`로 정리 — 테이블·컬럼·실제 enum·레거시 특성(FK 없음 / 대소문자·charset 혼용 / 삭제예정 컬럼) + 신규 4개 플랫폼 핵심 테이블 매핑
- 02 도메인 모델의 코드 추론값을 실측으로 교정: `pay_method` card/**deposit**, `order_item.status` request/design/print/complete, coupon AVAILABLE/USED/EXPIRED/PENDING, `product.price_calc_method` RAW/CUSTOM/**REMOTE**, `pricing_model` FIXED/PRODUCT_QUANTITY/ITEM_QUANTITY, 옵션·가격 룰 action, 디자인 구조(`design`/`design_file` 테이블 없이 `design_comment`+`product_design_slot`/`item`+`order_item`, `product_design_slot` 신규 발견)
- raw `schoolp-schema.sql`은 레포에 넣지 않고 큐레이션 문서만 동봉. `requiredDocs`에 07 추가. 코드·화면 무변경
- 핵심 발견: `product.PRICE_CALC_METHOD=REMOTE`(외부 API 가격계산 → 페이지산정 연결점), `product_design_slot`의 3모드(템플릿/의뢰/업로드 → 디자인허브 핵심)
- `docs/domain/06`(신규 플랫폼별 기획 매핑)은 **번들에서 제외** — 플랫폼별 기획은 담당 팀원이 자기 프로젝트에서 진행. `docs/domain`은 기존 시스템 이해·연동 참고용(01~05, 07)만 동봉. 06은 schoolp-ai-start 레포에 유지

## r007 · 2026-07-02 — 팀원 운영·데이터 체계 강화

Level: required · Scope: team-communication, slash-commands, session-hook, project-summary, local-data-rule · Risk: medium · Apply: docs, skills, hooks, scripts, manifest, state, download-page

- **커뮤니케이션 규칙**: 결과와 다음 할 일부터 말하고, 어려운 용어·AI 내부 동작(에이전트/캐시/워크플로우/단계명) 설명은 줄이며, 확인이 필요한 항목은 "결정 필요" 대신 부드럽게 표현
- **공식 요청 5개 + 기획을 실제 슬래시 커맨드/스킬로 등록**하고 충돌 방지용 `schoolp-` 접두어 적용: `/schoolp-run`·`/schoolp-save`·`/schoolp-load`·`/schoolp-deploy`·`/schoolp-summary`·`/schoolp-brainstorm`. Claude Code(`.claude/skills`)·Codex(`.agents/skills`) 동일 내용, 한국어 문장 트리거도 그대로. 기존 프로젝트에 반영해도 슬래시가 뜨도록 스킬 폴더·`settings.json`·`hooks.json`·`scripts` 복사 + 세션 재시작 안내
- **SessionStart 훅**(`.claude/settings.json`·`.codex/hooks.json`)이 세션 시작 시 원격 manifest와 현재 기준을 자동 비교. 업데이트가 있으면 AI가 첫 응답 맨 앞에서 팀원의 원래 요청보다 먼저 "지금 반영할까요? 1) 네 2) 나중에"로 묻고, 최신이면 무동작·네트워크 실패 시 조용히 통과. "나중에"면 이번 세션엔 다시 안 물음
- **프로젝트 요약 현황 파일**: `프로젝트 요약해줘`(`/schoolp-summary`)가 글 요약과 함께 개발자 전달용 파일 생성. `npm run schoolp:summary`가 프로젝트를 스캔해 바탕화면 `schoolp-summary/`에 `summary.html`(시각)·`PROJECT_SUMMARY.md`(개발자용 텍스트)를 만든다(화면/라우트, 목·실 API, 계약 타입, DB, 환경변수 key, 저장/배포 상태, 스타터 기준). 리포 커밋 안 함, PDF는 브라우저 인쇄로
- **로컬 저장(프로토타입 DB) 규칙**: 데이터가 남아야 하는 기능(저장/수정/삭제·쌓이는 목록·관리자·사용자별 데이터)은 목에 그치지 말고 로컬 SQLite(Prisma)로 실제 저장·조회. 계약(`contracts.ts`)과 1:1로 최소 구현, 추측 필드 금지, 기존 `/api/*` 목 route 내부만 교체, 만들기 전 한 줄 확인, 표시만 하는 화면엔 안 만듦. 로컬 SQLite는 개발자 확인 없이, 프로덕션 DB 설계·전환/실 외부 API/secret/도메인/EC2는 개발자 몫

## r006 · 2026-07-02 — schoolp 레거시 도메인 참고자료 동봉

Level: required · Scope: domain-reference · Risk: low · Apply: reference, docs, manifest, state, download-page

- 기존 schoolp 서비스(`schoolp-api`/`schoolp-web`/`schoolp-admin`) 코드 분석 as-is 참고자료를 `docs/domain/`으로 동봉(01 시스템개요, 02 도메인모델, 03~05 프로젝트별 상세, 06 신규 4개 플랫폼-도메인 매핑). 신규 플랫폼(AI챗봇 / 주문관리 고도화 / 디자인 예상 페이지 산정 / 디자인허브) 기획과 기존 서비스 개선 시 참고
- `docs/domain/`은 **스타터 표준도 API 계약도 아님** — 레거시 enum·엔드포인트를 실연동 대상으로 삼지 않고 `/api/*` 목 계약 우선 원칙을 그대로 적용. 상태값·구조는 개선 대상이며 새 설계를 레거시 enum에 맞추지 않음. schoolp 도메인과 무관한 프로젝트는 무시·삭제 가능. 지침 파일에 "도메인 기획이면 02·06 먼저 참고, 단 계약 아님" 규칙 추가, 코드·화면 무변경

## r005 · 2026-07-01 — contract-first 협업 + BFF 계약형 레퍼런스 + 기획 브레인스토밍

Level: required · Scope: collaboration-model, reference-contract, planning-elicitation, wip-guard · Risk: medium · Apply: reference, docs, manifest, state, download-page

- 데이터를 표시하는 화면이 인라인 목 배열이 아니라 항상 `/api/*` 목 route를 거치도록 레퍼런스를 계약형으로 변경: `page.tsx`가 `/api/applications`에서 받아 목록·요약 카드를 데이터에서 계산(하드코딩 숫자 제거), 공유 계약 타입 `src/lib/api/contracts.ts`, 목→실연동 seam 유지
- 팀원·개발자 협업을 **contract-first**로 정의(`docs/COLLABORATION_MODEL.md`): 계약(데이터 모양) 앞쪽(목 route+화면)은 팀원+AI, 뒤쪽(실 백엔드+DB)은 개발자. 개발자는 계약 확인·목→진짜 스위치 두 지점만 관여
- 새 프로젝트/화면/기능은 대량 구현 전 **질문형 기획 브레인스토밍** 먼저(`docs/PLANNING_ELICITATION.md`) — 서비스 언어로 묻고 빈/오류/권한/저장 상태를 캐내며 스펙 + 계약 초안 + 개발자 이관 목록 산출
- 위험 항목은 매번 멈추지 않고 `HANDOFF.md`에 배치로 모음. `docs/API_CONTRACT.md`를 목→진짜 전환 스위치로 명확화. 이미 개발 중인 프로젝트가 미적용으로 감지돼도 전체 구조 전환을 자동 실행하지 않고 `개발자 확인 필요`로 멈춤(WIP 보호)

## r004 · 2026-06-30 — manifest-first 부트스트랩

Level: required · Scope: existing-project-apply, manifest-first · Risk: low · Apply: docs, manifest, state, download-page

- 안내 페이지는 요약본임을 명확히 하고, URL만 받으면 페이지를 정본으로 오인하지 않도록 ZIP 다운로드·정본 문서 읽기·`requiredDocs` 대조부터 진행
- `AI_START_HERE.md`·`AGENTS.md`·`CLAUDE.md`에 "URL만 받으면 ZIP/매니페스트를 먼저 확인" 부트스트랩 규칙 보강 — 요약 페이지만 보고 기존 프로젝트에 부분 반영하던 문제 방지

## r003 · 2026-06-22 — 커맨드 5개 확정 + 저장 안전절차 + 기존 프로젝트 감지·반영 + README 분리

Level: required · Scope: ai-commands, github-save-safety, existing-project-update, readme-policy · Risk: medium · Apply: docs, manifest, state, download-page

- 팀원에게 노출하는 **공식 요청을 5개로 고정**하고 업데이트 확인·스타일 점검·작업 기록은 AI 내부 절차로. `커맨드 목록 보여줘`는 숨은 도움말로만
- `저장해줘` 단독 요청을 자동 처리하지 않고 먼저 확인. `작업 저장해줘`=GitHub commit/push, 작업 기록=`WORK_LOG.md`로 의미 분리
- **기존 프로젝트는 schoolp starter 적용 여부를 먼저 감지** — 적용됐으면 전체 전환 없이 부족한 최신 기준만, 미적용이면 표준 Next.js 구조로 전환(기존 UI·스타일·카피·상호작용 보존)
- GitHub·Vercel CLI/로그인/링크가 없어도 실패로 끝내지 않고 준비 절차 진행. 회원가입·브라우저 로그인·2FA는 팀원이 직접, 인증 URL은 가능하면 브라우저로 열고 클릭 링크 + 코드 함께 표시
- 팀원 프로젝트 `README.md`를 실제 서비스 설명 템플릿으로, starter 사용법은 `docs/SCHOOLP_STARTER_GUIDE.md`로 분리

## r002 · 2026-06-19 — 업데이트 정책·매니페스트 체계 + 커맨드/GitHub/Vercel 워크플로우

Level: required · Scope: update-policy, manifest, ai-commands, github-workflow, vercel-deploy · Risk: medium · Apply: docs, scripts, package-scripts, state

- `starter-manifest.json`·`.schoolp/starter-state.json`·`docs/UPDATE_POLICY.md`·`docs/UPDATE_APPLY_GUIDE.md` 도입, `npm run schoolp:update:check`로 최신 기준 확인. 매 요청마다 확인하지 않고 정해진 시점에만, 기존 UI/스타일/기능 보존하며 부족한 기준만 반영
- 필수 AI 커맨드(실행 / 작업 저장 / 최신 작업 불러오기 / 배포 / 요약) 정리, 새 세션 시작 시 커맨드 표 먼저 안내
- GitHub private 저장소를 작업 저장·이어하기 용도로, Vercel을 화면 확인용 배포로 정리(실서비스 운영은 개발자가 EC2에서). 배포 전 미저장 변경 확인 질문
- `AI_START_HERE.md`를 AI 작업 정본으로 고정하고 `AGENTS.md`·`CLAUDE.md`는 얇은 어댑터로. 공개 URL에서 manifest 직접 확인, `.env*` 제외(`.env.example`만), `eslint . --max-warnings=0`·style guard 기준 보강

## r001 · 2026-06-12 — Next.js 스타터 초기 기준

Level: required · Scope: initial-starter, local-run, style-guard, vercel-deploy · Risk: medium · Apply: starter-structure, docs, scripts, package-scripts

- Next.js App Router 시작 파일 구조와 AI 작업 기준 정리
- 기존 HTML/MD 프로젝트를 Next.js 구조로 이식하는 기준과 기존 UI·스타일·레이아웃·카피·프론트 상호작용 보존 규칙
- 로컬 실행 주소 `http://localhost:3000` 고정, Windows 실행·3000 포트 정리 기준
- BFF와 로컬 DB 선택 사용 기준
- 스타일 보호 기준과 Vercel 검토용 배포 기준, AI 커맨드 목록·작업 기록 문서 추가
