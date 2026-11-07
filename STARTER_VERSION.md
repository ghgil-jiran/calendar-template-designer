# Starter Standard

Current Revision: r015
Revision Number: 15
Updated: 2026-07-20
Manifest: https://schoolp-ai-starter.vercel.app/starter-manifest.json

이 시작 파일은 schoolp Next.js starter 기준입니다.

`r001` ~ `r015`는 모든 수정 횟수가 아니라 팀원 프로젝트에 적용할 schoolp starter 기준입니다. 문구 수정, 다운로드 페이지 UI 조정, 오타 수정처럼 기존 프로젝트 반영이 필요 없는 변경은 같은 기준의 Maintenance로 기록하고 revision을 올리지 않습니다.

기존 프로젝트에 이미 schoolp 기준이 적용되어 있어도 업데이트 내역만 기준으로 판단하지 않습니다. 현재 프로젝트의 전체 구조와 `AI_START_HERE.md`, `CLAUDE.md`, `AGENTS.md`, `docs` 폴더 문서를 다시 읽고, 현재 프로젝트에 부족한 기준을 반영합니다.

## Revision Policy

기본값은 **"revision을 올리지 않는다"**입니다. 아래 "올릴 때" 조건에 분명히 해당할 때만 번호를 올리고, 애매하면 Maintenance로 둡니다.

**revision을 올릴 때** (팀원 프로젝트가 새로 반영해야 하는 변화일 때만)

- starter 구조, AI 작업 흐름, 실행/배포 기준, 안전 기준이 바뀌어 **팀원 AI가 다르게 행동해야 할 때**
- starter ZIP 안의 문서·스크립트·스킬·훅이 의미 있게 바뀌어 기존 프로젝트에도 반영이 필요할 때

**revision을 올리지 않을 때** (Maintenance로 기록)

- 오타 수정, 설명 보강, changelog·문구 다듬기
- 다운로드 페이지(`index.html`)의 문구/UI 조정
- 배포 전 로컬 실험, Vercel 재배포만 한 경우
- 팀원 프로젝트에 다시 반영할 필요가 없는 내부 정리

**올릴 때 규칙**

- 번호는 `r001`, `r002`처럼 1씩 순차 증가합니다. AI는 표기 문자열을 파싱하지 않고 manifest의 `revisionNumber` 값으로 비교합니다(`r001 = 1`, `r002 = 2`).
- 날짜는 revision이 아니라 `Updated` 값으로만 관리합니다.
- **한 배포 = 한 revision.** 한 번 작업하며 생긴 여러 변경은 같은 날 여러 번 올리지 말고 배포 단위로 하나에 묶습니다.
- 올릴 때는 다운로드 페이지 최신 표시, `starter-manifest.json`(루트/site 미러/번들 3곳), `STARTER_VERSION.md`, `CHANGELOG.md` 최신 항목, `.schoolp/starter-state.json`, starter ZIP을 같은 기준으로 함께 맞춥니다.
- `CHANGELOG.md`는 참고용입니다. 기존 프로젝트는 전체 구조와 현재 기준 문서를 다시 확인한 뒤 부족한 기준만 반영합니다.

## Update Policy

- 최신 기준 확인은 매 요청마다 하지 않습니다. 새 작업 세션, 배포 전, 큰 기능 개발 전, 반복 오류 발생 시, 사용자가 요청한 경우에만 확인합니다.
- 최신 기준 확인은 파일을 수정하지 않고 최신 기준과 현재 기준의 차이만 보고합니다.
- starter 기준 안전 반영은 기존 UI, 스타일, 기능을 보존하고 부족한 문서, 실행 기준, 배포 기준, 안전 규칙만 반영합니다.
- 자세한 절차는 `docs/UPDATE_POLICY.md`, `docs/UPDATE_APPLY_GUIDE.md`를 따릅니다.

## README Policy

팀원 프로젝트의 `README.md`는 실제 서비스 설명을 우선하고, starter 사용법은 `docs/SCHOOLP_STARTER_GUIDE.md`를 따른다.
