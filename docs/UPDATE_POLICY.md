# Update Policy

schoolp starter 업데이트는 자동 덮어쓰기 작업이 아닙니다. 최신 기준을 확인하고, 현재 프로젝트에 부족한 개발 기준만 안전하게 보완하는 작업입니다.

## 현재 기준

- Current Revision: r014
- Updated: 2026-07-10
- Manifest: https://schoolp-ai-starter.vercel.app/starter-manifest.json

## 확인 시점

매 요청마다 최신 기준을 확인하지 않습니다. 아래 상황에서만 확인합니다.

- 새 작업 세션을 시작할 때
- 며칠 쉬었다가 다시 작업할 때
- 회사/집 PC 또는 새 Codex 세션에서 이어서 작업할 때
- `배포해줘` 요청 전
- 큰 기능 개발을 시작하기 전
- 실행, 스타일, 배포 오류가 반복될 때
- AI가 starter 기준 확인 또는 안전 반영이 필요하다고 판단했을 때

## 업데이트 등급

- `required`: 실행, 배포, 안전, 데이터 손실 방지처럼 반드시 반영해야 하는 기준
- `recommended`: 현재 프로젝트에 도움이 되면 반영하는 기준
- `optional`: 참고용 변경, 요청이 있을 때만 반영
- `breaking`: 개발자 확인 없이 반영하지 않는 기준

## 기본 원칙

1. 업데이트 내역은 참고용입니다. 실제 적용은 전체 기준 문서와 현재 프로젝트 상태를 함께 보고 판단합니다.
2. 기존 UI, 스타일, 레이아웃, 카피, 프론트 기능은 보존합니다.
3. starter ZIP을 현재 프로젝트에 통째로 덮어쓰지 않습니다.
4. 부족한 문서, 실행 스크립트, 배포 기준, 안전 규칙만 반영합니다.
5. 변경 전에는 반영 대상 파일과 제외 대상을 먼저 정리합니다.
6. 변경 후에는 `WORK_LOG.md`에 반영한 기준과 변경 파일을 기록합니다.

## 자동 반영 가능 범위

- `AI_START_HERE.md`
- `CLAUDE.md`
- `AGENTS.md`
- `AI_COMMANDS.md`
- `STARTER_VERSION.md`
- `CHANGELOG.md`
- `WORK_LOG.md`
- `docs/`
- `.gitignore`
- `eslint.config.mjs`
- `scripts/`의 schoolp 보조 스크립트
- `package.json`의 schoolp 관련 scripts
- `.schoolp/starter-state.json`

## 자동 반영 금지 범위

- 실제 화면 파일과 주요 컴포넌트
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/`
- `src/features/`
- `public/`
- API route
- DB schema, Supabase migration/seed
- 인증, 권한, 결제, 개인정보 관련 코드
- package dependency 추가/major 변경
- `.env`와 secret

위 범위에 변경이 필요하면 `개발자 확인 필요`로 멈춥니다.

## Revision을 올릴 때 / 올리지 않을 때

기본값은 **"revision을 올리지 않는다"**입니다. 아래 "올릴 때"에 분명히 해당할 때만 번호를 올리고, 애매하면 Maintenance로 둡니다.

**올릴 때** (팀원 프로젝트가 새로 반영해야 하는 변화)

- starter 구조·AI 작업 흐름·실행/배포/안전 기준이 바뀌어 팀원 AI가 다르게 행동해야 할 때
- starter ZIP 안의 문서·스크립트·스킬·훅이 의미 있게 바뀌어 기존 프로젝트에도 반영이 필요할 때

**올리지 않을 때** (현재 revision의 Maintenance로 기록)

- 오타 수정, 설명 보강, changelog·문구 다듬기
- 다운로드 페이지(`index.html`) 문구/UI 조정
- 배포 전 로컬 실험, Vercel 재배포만 한 경우
- 팀원 프로젝트에 다시 반영할 필요가 없는 내부 정리

**한 배포 = 한 revision.** 한 번 작업하며 생긴 여러 변경은 같은 날 여러 번 올리지 말고 배포 단위로 하나에 묶습니다. 올릴 때는 `starter-manifest.json`(루트/site 미러/번들 3곳), `STARTER_VERSION.md`, `CHANGELOG.md`, `.schoolp/starter-state.json`, 다운로드 페이지, starter ZIP을 함께 맞춥니다.
