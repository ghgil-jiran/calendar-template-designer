# schoolp Starter Guide

이 문서는 schoolp Next.js 시작 파일의 사용법과 운영 기준을 정리한 starter 전용 안내서입니다.

실제 팀원 프로젝트의 `README.md`는 서비스 설명을 우선해야 하므로, starter 사용법과 AI 작업 규칙은 이 문서와 `AI_START_HERE.md`, `AI_COMMANDS.md`, `docs/` 문서를 기준으로 확인합니다.

---

# schoolp Next.js App

학교사업팀 웹서비스 개발을 위한 Next.js 시작 파일입니다.

## 사용 방법

학교사업팀 팀원은 제공받은 ZIP을 압축 해제한 뒤 이 폴더를 Codex/Claude에서 엽니다.

팀원은 GitHub와 Vercel 명령을 직접 외우지 않습니다. 필요한 작업은 AI에게 짧게 요청합니다.

Node.js 20.19 이상을 사용합니다.

처음 AI 세션을 열면 아래 문장을 먼저 전달합니다.

```text
AI_START_HERE.md를 먼저 읽고 이 프로젝트 규칙에 맞춰 작업해줘.
```

그 다음 필요한 일을 짧게 말합니다.

| 하고 싶은 일 | 말할 문장 |
|---|---|
| 로컬에서 화면 보기 | `실행해줘` |
| GitHub에 작업 저장하기 | `작업 저장해줘` |
| GitHub에서 불러오기 | `작업 불러와줘` |
| 팀 공유용으로 배포하기 | `배포해줘` |
| 핸드오프 정리하기 | `핸드오프 정리해줘` |
| 간단한 사용 안내 보기 | `도움말` |

새 화면·기능은 만들 내용을 그대로 설명하면 AI가 필요한 요건을 확인한 뒤 기획부터 이어갑니다. 막히거나 궁금한 점도 상황을 그대로 질문하면 됩니다. 점검·최신 기준 확인은 필요한 시점에 AI가 처리하고, Supabase 데이터 확인은 요청하면 됩니다.

AI가 내부적으로 실행하는 기본 명령은 아래와 같습니다. 팀원이 직접 외울 필요는 없습니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run dev`는 시작 전에 `npm run style:check`로 Tailwind와 전역 스타일 연결을 확인합니다.

브라우저에서 `http://localhost:3000`을 엽니다. 이 프로젝트는 로컬 개발 포트를 3000으로 고정합니다.

Windows에서 Node.js 또는 npm 명령을 찾지 못하면 Node.js LTS를 먼저 설치한 뒤 Codex/PowerShell을 다시 엽니다.

Windows 팀원은 `start-windows.cmd`를 실행합니다. 이 파일은 Node/npm 확인, 설치 안내, 3000번 포트 정리, 의존성 설치, 로컬 실행을 순서대로 진행합니다.

## AI 작업 전 필수

Codex, Claude 등 AI 도구를 사용할 때는 먼저 아래 파일을 읽게 합니다.

- `AI_START_HERE.md`
- `STARTER_VERSION.md`
- `CHANGELOG.md`
- `AI_COMMANDS.md`
- `WORK_LOG.md`
- `AGENTS.md`
- `CLAUDE.md`
- `schoolp_ai_project_guide.md`
- `docs/GITHUB_WORKFLOW.md`
- `docs/API_CONTRACT.md`
- `docs/VERCEL_DEPLOYMENT.md`
- `SANDBOX_WORKFLOW.md`

AI에게 작업을 시작할 때 아래 문장을 전달하는 것을 권장합니다.

```text
AI_START_HERE.md를 먼저 읽고 이 프로젝트 규칙에 맞춰 작업해줘.
이 프로젝트는 Next.js App Router 기반 시작 파일이야.
작업 전에 위험 영역이 있는지 판단하고, 인증/권한/결제/개인정보/운영 DB 설계·전환/운영 환경변수/secret/새 패키지/공식 도메인/실제 외부 API/사용자 공개 반영이 포함되면 구현하지 말고 개발자 확인 필요로 정리해줘. 개발/검토용 Supabase Postgres 저장은 `docs/SUPABASE_WORKFLOW.md` 기준으로 진행해줘.
```

기존 프로젝트 전환은 리디자인이 아니라 구조 이식 작업입니다. 기본 화면은 원본 메인 화면과 동일해야 하며, 원본에 없던 UI는 실제 앱 화면에 추가하지 않습니다.

기존 프로젝트를 전환할 때는 전환 결과물 안에 보존용 `legacy`, `backup`, `old` 폴더나 중복 원본 파일을 임의로 만들지 않습니다.

이미 개발이 진행 중인 프로젝트(작업 중인 화면/컴포넌트가 이미 존재)가 starter 미적용으로 감지되어도, 구조를 새로 만들고 화면을 이식하는 전체 전환을 자동으로 실행하지 않습니다. 이 경우 멈추고 `개발자 확인 필요`로 보고하며, 로컬 규칙 문서와 `scripts/`·설정 기준만 보완하고 `src/app`·`src/components`·`src/features` 구조와 화면은 건드리지 않습니다. 전체 구조 전환은 사용자가 명시적으로 요청했을 때만 진행합니다. HTML/MD/정적 목업만 있고 실제 개발된 화면 코드가 없는 프로젝트는 기존 이식 규칙을 그대로 따릅니다.

## 기본 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 스타일의 기본 UI 컴포넌트
- 저장이 필요한 경우 Supabase Postgres
- 필요 시 Next.js Route Handler 기반 BFF
- `docs/SUPABASE_WORKFLOW.md`, `examples/supabase-prototype-db` 참고

## 로컬 개발 원칙

팀원 로컬 개발에서는 Docker를 기본 사용하지 않습니다.

Docker, CI/CD, 서버 배포 파일은 개발자가 관리합니다.

팀원은 Git 명령을 직접 사용하지 않습니다.

GitHub는 회사/집/다른 PC에서 이어서 작업하기 위한 저장소로만 사용합니다. `작업 저장해줘`, `최신 작업 불러와줘` 요청을 받으면 AI가 안전 절차 안에서만 GitHub CLI와 Git을 사용합니다. Git 저장소나 GitHub CLI가 없으면 AI가 가능한 준비 절차를 먼저 진행하고, 브라우저 로그인/회원가입/2FA처럼 사람 인증이 필요한 단계에서만 팀원에게 입력을 요청합니다. 인증 URL이 나오면 AI가 가능한 경우 브라우저를 열고, 동시에 클릭 가능한 `URL: [인증 페이지](...)` 링크와 코드를 표시합니다.

`저장해줘`만 단독으로 입력하면 의미가 애매하므로 AI는 바로 저장하지 않고 `작업 저장해줘`인지 `작업 기록 남겨줘`인지 확인해야 합니다.

팀원은 FTP/SFTP/rsync/scp로 서버에 직접 전송하지 않습니다. sandbox 결과 반영은 개발자가 처리합니다.

서버 전용 코드는 `src/server`에 둡니다. API route가 필요하면 `src/app/api/.../route.ts`를 사용합니다.

데이터가 남아야 하는 기능(저장/수정/삭제·목록·관리자 데이터)은 개발/검토용 Supabase Postgres에서 실제로 저장되게 만듭니다. 계약에 묶어 **최소로**, 만들기 전 한 줄로 알립니다. 표시만 하는 화면엔 DB를 만들지 않습니다. 운영 DB 설계·전환은 개발자 몫입니다. 자세한 기준은 `docs/SUPABASE_WORKFLOW.md`.

기본 템플릿에는 활성 Supabase 프로젝트나 DB 연결 코드가 없습니다. 필요할 때만 `examples/supabase-prototype-db`의 참고 예시를 보고 서비스에 맞는 migration/seed/env/API route를 만듭니다.

공통 API 연동은 `docs/API_CONTRACT.md`에 공식 문서 URL 또는 endpoint 명세가 있을 때만 진행합니다. 문서가 없어도 화면에 데이터가 필요하면 컴포넌트에 값을 하드코딩하지 않고, `/api/*`에 타입이 붙은 목 route를 만들어 그 데이터를 받아 렌더합니다.

## 데이터 표시 규칙 (BFF 기본)

데이터를 표시하는 화면은 데이터를 항상 `/api/*` route를 거쳐서 받습니다. BFF 계층을 기본으로 만듭니다.

- 화면(컴포넌트/페이지)에 데이터를 하드코딩하지 않습니다. 인라인 목(mock) 배열을 두지 않습니다.
- 공식 API 문서가 없어도 `/api/*`에 타입이 붙은 목 route를 만들고, 화면은 목록과 요약 수치를 모두 그 데이터에서 계산합니다.
- 계약(데이터 모양) 타입은 `src/lib/api/contracts.ts`에 두고 route와 화면이 같은 타입을 import 해서 공유합니다.
- 실제 API가 연결되면 화면과 계약 타입은 그대로 두고 목 route만 실제 연동으로 교체합니다(seam 유지). 목 route는 실연동이 아니므로 "문서 없을 때 실제 API 연동 금지"와 충돌하지 않습니다.
- 레퍼런스: `src/app/api/applications/route.ts`, `src/lib/api/contracts.ts`, `src/app/page.tsx`.

## 협업 모델 (계약 우선)

팀원과 개발자는 서로의 작업을 합치지 않고, 처음에 **계약(데이터 모양)만 맞추고 각자 따로 만든 뒤** 마지막에 목을 진짜로 교체합니다.

- 계약 **앞쪽**(`/api/*` 목 route + 화면·기능) = 팀원 + AI.
- 계약 **뒤쪽**(실제 백엔드 + DB) = 개발자.
- 개발자가 관여하는 지점은 ② 계약 확인(대개 채팅)과 ④ 목→진짜 스위치 두 번뿐입니다.
- 새 프로젝트/기능은 질문형 기획 브레인스토밍으로 시작해 스펙·계약 초안·개발자 이관 목록을 만듭니다.
- 자세한 기준: `docs/COLLABORATION_MODEL.md`, `docs/PLANNING_ELICITATION.md`, `HANDOFF.md`.

## 주요 명령

팀원이 AI에게 짧게 요청할 수 있는 작업은 상단 표와 `AI_COMMANDS.md`를 기준으로 합니다.

GitHub 저장은 회사/집/다른 PC에서 이어서 작업하기 위한 것입니다.
Vercel production alias는 팀 공유용 화면 검토 링크입니다. AI는 Vercel 배포를 사용자 공개 반영이나 서비스 오픈으로 표현하지 않습니다.

팀원이 AI와 함께 실행해도 되는 기본 명령:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run style:check
npm run cache:clean
npm run dev:fresh
```

로컬 실행 규칙:

- 로컬 주소는 항상 `http://localhost:3000`을 사용합니다.
- 다른 포트로 우회 실행하지 않습니다.
- 3000번 포트가 이미 사용 중이면 기존 dev server를 종료한 뒤 다시 실행합니다.
- Windows에서 실행이 꼬이면 `start-windows.cmd`를 실행합니다.
- 스타일이 전부 사라진 것처럼 보이면 먼저 `npm run style:check`를 실행합니다.
- 코드와 스타일 보호 파일이 정상인데 dev server 산출물이 꼬였으면 `npm run cache:clean` 후 `npm run dev`를 실행합니다.

스타일 보호 파일:

- `src/app/layout.tsx`
- `src/app/globals.css`
- `tailwind.config.ts`
- `postcss.config.js`

저장이 필요한 경우 Supabase 준비 기준은 `docs/SUPABASE_WORKFLOW.md`를 따릅니다.

```bash
supabase login
supabase init
supabase link
```

Supabase project 선택, access token, secret 입력은 팀원이 직접 진행합니다. 운영 DB 설계·전환은 개발자 확인 후에만 진행합니다.

## GitHub 작업 저장

팀원이 AI에게 `작업 저장해줘`라고 요청하면 현재 작업 상태를 GitHub에 저장합니다.

처음 저장하는 프로젝트는 AI가 `git init`, GitHub CLI 준비, 로그인 확인 후 private 저장소를 생성합니다. GitHub 로그인 또는 저장소 생성 안내가 나오면 팀원이 본인 계정으로 인증합니다. 인증이 끝나면 AI가 저장을 계속합니다.

주의:

- GitHub 저장은 사용자 공개 반영이 아닙니다.
- 저장소는 반드시 private으로 만듭니다.
- `.env*`, DB 파일, `.vercel`, `.next`, `node_modules`, ZIP, 로그 파일은 저장하지 않습니다. 단, `.env.example`은 저장할 수 있습니다.
- force push, hard reset, branch 삭제, remote 강제 변경은 하지 않습니다.

## Vercel 화면 배포

팀원이 AI에게 `배포해줘`라고 요청하면 현재 작업을 Vercel에 배포합니다.

AI는 `npm run deploy`를 실행합니다. 이 명령은 빌드 확인 후 Vercel 배포를 진행합니다. 빌드 오류가 있으면 다른 플랫폼으로 우회하지 말고 오류를 수정한 뒤 다시 Vercel 배포를 시도합니다.

이 starter는 Vercel production alias를 팀 공유용 고정 화면 링크로 사용합니다. Vercel의 production URL이 갱신되지만 사용자 공개 반영은 아닙니다.

첫 배포이거나 연결된 프로젝트가 불확실하면 AI는 배포 전에 Vercel 로그인 계정, team, project를 확인하고 짧게 보고합니다.

처음 배포하는 PC에서는 Vercel CLI, 로그인, 프로젝트 연결 안내가 나올 수 있습니다. AI가 가능한 준비 절차를 먼저 진행하고, 인증 URL이 나오면 가능한 경우 브라우저를 열며, 동시에 클릭 가능한 `URL: [인증 페이지](...)` 링크를 표시합니다. 브라우저가 자동으로 열리면 팀원이 본인 Vercel 계정으로 로그인합니다. 브라우저가 열리지 않으면 터미널에 표시된 로그인 URL을 직접 브라우저에 붙여넣어 인증합니다. 인증이 끝나면 AI가 배포를 계속합니다.

허용:

```bash
npm run deploy
```

배포 전 저장 여부:

```text
배포 전에 현재 작업을 GitHub에 저장할까요?

1. 저장 후 배포하기 (추천)
2. 배포만 하기
```

주의:

- 배포 플랫폼은 Vercel만 사용합니다.
- Netlify, Firebase, Replit, Codex Sites 등 다른 플랫폼으로 우회하지 않습니다.
- Vercel 배포는 화면 확인용입니다.
- 사용자에게 공개되는 실제 서비스 반영은 개발자 검토 후 별도 릴리스 절차로 진행합니다.
- 공식 도메인 연결, 운영 환경변수 설정, DB 전환, 인증/결제/개인정보 연동, 사용자 공개 반영은 개발자 확인 후 진행합니다.
- 배포 후 URL을 팀원에게 알려줍니다.

## 주의

- `.env*`는 전달 파일에 포함하지 않습니다. 단, `.env.example`은 포함할 수 있습니다.
- 로컬 저장 파일, secret, token, password는 커밋하지 않습니다.
- `node_modules`, `.next`, `.vercel`, 다운로드한 시작 ZIP, 중첩 시작 폴더는 전달 파일에 포함하지 않습니다.
- 실제 학생/학부모/학교 정보를 mock 데이터나 AI 프롬프트에 넣지 않습니다.
- API 문서에 없는 endpoint, field, status는 만들지 않습니다.

## 개발 도메인 반영

팀원은 서버나 개발 도메인에 직접 업로드하지 않습니다.

권장 흐름:

```text
팀원 sandbox 작업
-> 로컬에서 화면 확인
-> GitHub에 작업 저장
-> Vercel에 현재 작업 배포
-> 개발자가 검토
-> 개발자가 별도 릴리스 절차로 실제 서비스 반영
```

팀원이 전달할 내용:

```text
서비스명:
작업 요약:
확인한 화면:
개발자 확인 필요 항목:
sandbox 폴더 또는 압축 파일:
```

전달 시 `HANDOFF.md` 양식을 사용합니다.
