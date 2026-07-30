# GitHub Workflow

GitHub는 회사/집/다른 PC에서 이어서 작업하기 위한 저장소입니다.

GitHub 저장은 사용자 공개 반영이나 서비스 오픈이 아닙니다.

## 기본 원칙

- 팀원은 Git 명령을 직접 실행하지 않습니다.
- Git 저장소가 아니거나 GitHub CLI가 없어도 AI는 그 이유만 말하고 멈추지 않고, 가능한 준비 절차를 진행합니다.
- AI는 `작업 저장해줘`, `최신 작업 불러와줘`, `저장하고 배포해줘`의 안전 절차 안에서만 `git`과 `gh`를 사용합니다. `저장해줘`만 단독으로 입력되면 GitHub 저장으로 자동 해석하지 않고 먼저 확인 질문을 합니다.
- 지정된 GitHub 저장/불러오기 절차 밖의 git clone, commit, push, branch, merge, remote 설정은 하지 않습니다.
- 저장소는 반드시 private으로 만들고, 저장 전후 private 상태를 확인합니다.
- GitHub에 push해도 실제 서비스에는 반영되지 않습니다.

## GitHub preflight

AI는 GitHub 작업 전에 아래를 확인합니다.

- `git status`
- current branch
- remote URL
- GitHub account: `gh auth status`
- repository visibility
- untracked files
- secret/env 파일 포함 여부
- `.env*`, `.vercel`, `.next`, `node_modules`, DB 파일, ZIP, 로그 파일 포함 여부

GitHub 저장은 idempotent checkpoint입니다. 저장 전후 repository URL, branch, commit hash, visibility를 보고합니다.

## GitHub 준비 자동화

`작업 저장해줘` 또는 `최신 작업 불러와줘` 요청에서 GitHub 준비가 안 되어 있어도 그 이유만 말하고 멈추지 않습니다. AI는 가능한 준비 작업을 순서대로 진행합니다.

1. `git --version`으로 Git 설치 여부를 확인합니다.
2. Git 저장소가 아니면 `git init`을 진행합니다.
3. `gh --version`으로 GitHub CLI 설치 여부를 확인합니다.
4. `gh`가 없으면 OS에 맞게 설치를 시도합니다.
   - macOS: Homebrew가 있으면 `brew install gh`를 시도합니다.
   - Windows: `winget`이 있으면 `winget install --id GitHub.cli -e`를 시도합니다.
   - 위 방법이 없거나 관리자 권한이 필요하면 GitHub CLI 공식 설치 페이지를 안내하고, 설치 후 Codex/터미널을 다시 열게 합니다.
5. `gh auth status`로 로그인 상태를 확인합니다.
6. 로그인이 안 되어 있으면 `gh auth login`을 실행하고, 브라우저 로그인/회원가입/2FA는 팀원이 직접 진행하게 안내합니다.
7. 인증이 끝나면 AI가 다시 상태를 확인하고 private 저장소 생성, remote 연결, commit, push를 계속 진행합니다.

회원가입, 브라우저 로그인, 비밀번호 입력, 2FA 입력은 AI가 대신하지 않습니다. 하지만 인증이 필요한 지점까지는 AI가 직접 진행하고, 인증 완료 후에는 저장 절차를 계속합니다.

`gh auth login`은 브라우저 인증 흐름을 우선 사용합니다. AI는 Personal Access Token을 요구하지 않습니다. Token이 필요한 경우에도 AI는 token 값을 채팅에 받거나 출력하지 않습니다. 팀원 또는 개발자가 CLI/브라우저 프롬프트에 직접 입력합니다.

인증 URL이 표시되면 AI는 가능한 경우 브라우저를 열어 해당 URL로 이동합니다. 동시에 팀원이 직접 열 수 있도록 클릭 가능한 링크와 코드를 함께 보여줍니다.

예시:

```text
GitHub 인증이 필요합니다.
URL: [GitHub 인증 페이지](https://github.com/login/device)
Code: ABCD-1234
브라우저에서 로그인/회원가입/2FA/Authorize를 완료해 주세요. 인증이 끝나면 제가 이어서 진행합니다.
```

브라우저 제어가 불가능하면 URL과 코드를 복사하기 쉽게 위 형식으로 안내합니다. 로그인, 회원가입, 비밀번호 입력, 2FA, 계정 선택, 권한 승인은 팀원이 직접 진행합니다.

## 작업 저장해줘

`작업 저장해줘`는 GitHub commit/push를 의미합니다. `저장해줘`만 입력된 경우에는 GitHub 저장을 진행할지 먼저 확인합니다.

현재 작업 상태를 GitHub에 저장합니다.

절차:

1. `git --version`과 `gh --version`으로 Git/GitHub CLI 사용 가능 여부를 확인합니다.
2. GitHub CLI가 없으면 OS에 맞는 설치를 시도하거나 설치 안내를 진행합니다.
3. `gh auth status`로 GitHub 로그인 상태를 확인합니다.
4. 로그인이 안 되어 있으면 `gh auth login`을 시작하고 팀원이 브라우저 로그인/회원가입/2FA를 직접 진행하게 안내합니다.
5. `git status`로 변경 파일을 확인합니다.
6. 금지 파일이 포함되어 있는지 확인합니다.
7. 가능하면 `npm run style:check`, `npm run build`를 실행합니다.
8. Git 저장소가 아니면 `git init`을 진행합니다.
9. remote가 없으면 GitHub CLI로 private 저장소를 생성합니다.
10. remote가 있으면 연결된 GitHub 저장소가 맞는지 확인합니다.
11. 변경사항을 commit합니다.
12. GitHub에 push합니다.
13. GitHub 저장소 URL, branch, commit hash, private 확인 여부를 보고합니다.

처음 사용하는 PC에서 GitHub 로그인 안내가 나오면 팀원이 본인 GitHub 계정으로 인증합니다. 회원가입, 브라우저 로그인, 비밀번호 입력, 2FA 입력은 팀원이 직접 진행하고, 인증이 끝나면 AI가 저장을 계속합니다.

## 최신 작업 불러와줘

GitHub에 저장된 최신 작업을 현재 PC로 가져옵니다.

절차:

1. `git --version`과 `gh --version`으로 Git/GitHub CLI 사용 가능 여부를 확인합니다.
2. GitHub CLI가 없으면 OS에 맞는 설치를 시도하거나 설치 안내를 진행합니다.
3. `gh auth status`로 GitHub 로그인 상태를 확인합니다.
4. 현재 폴더에 저장하지 않은 변경사항이 있는지 확인합니다.
5. 저장하지 않은 변경사항이 있으면 먼저 `작업 저장해줘`를 제안합니다.
6. remote 저장소를 확인합니다.
7. `git fetch`로 최신 상태를 확인합니다.
8. fast-forward 가능한 경우에만 `git pull --ff-only`로 가져옵니다.
9. 충돌, divergent branch, 저장하지 않은 변경사항이 있으면 자동 해결하지 않고 상황을 설명합니다.
10. 임의 stash, 강제 reset, 강제 merge는 하지 않습니다.
11. 가져온 뒤 `npm install` 필요 여부와 실행 상태를 안내합니다.

## 저장하면 안 되는 파일

- `.env*`
- 단, `.env.example`은 저장 가능
- DB 파일
- `.vercel`
- `.next`
- `node_modules`
- ZIP 파일
- 로그 파일
- secret, token, password, DB URL이 들어간 파일

## 하지 않는 작업

- public 저장소 생성
- 지정된 안전 절차 밖의 commit, push, branch, merge, remote 설정
- force push
- hard reset
- rebase
- 임의 stash
- branch 삭제
- remote 강제 변경
- repository transfer
- GitHub Actions 설정 변경
- GitHub Actions secret 임의 등록
- organization 권한 변경
- secret 저장
