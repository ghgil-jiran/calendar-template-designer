# Vercel Deployment

이 프로젝트의 Vercel 배포는 현재 작업을 확인하기 위한 배포입니다.

Vercel production alias는 팀 공유용 화면 검토 링크입니다. AI는 Vercel 배포를 사용자 공개 반영이나 서비스 오픈으로 표현하지 않습니다.

## 기본 원칙

- 팀원은 `배포해줘`라고 요청합니다.
- AI는 `npm run deploy`로 빌드 확인 후 Vercel production alias에 현재 작업을 배포합니다.
- Vercel CLI, 로그인, project link가 없어도 AI는 그 이유만 말하고 멈추지 않고, 가능한 준비 절차를 진행합니다.
- 배포 플랫폼은 Vercel만 사용합니다.
- Netlify, Firebase, Replit, Codex Sites 등 다른 플랫폼으로 우회하지 않습니다.
- 배포 후 접속 URL을 팀원에게 알려줍니다.

## Vercel project identity lock

AI는 배포 전에 현재 폴더가 연결된 Vercel project identity를 확인합니다.

확인 항목:

- Vercel account/team
- project name
- project id
- production alias
- `.vercel/project.json` 존재 여부

project identity가 불명확하면 `vercel link --yes`로 자동 진행하지 않습니다. team/project 선택이 필요한 경우 팀원에게 짧게 확인합니다.

## Vercel 준비 자동화

`배포해줘` 요청에서 Vercel 준비가 안 되어 있어도 그 이유만 말하고 멈추지 않습니다. AI는 가능한 준비 작업을 순서대로 진행합니다.

1. `node --version`, `npm --version`으로 Node/npm 사용 가능 여부를 확인합니다.
2. Vercel CLI가 없으면 우선 `npx vercel` 또는 `npx vercel@latest` 기준으로 진행합니다.
3. Vercel 로그인이 필요하면 CLI가 안내하는 브라우저 인증을 팀원이 직접 진행하게 합니다.
4. Vercel 계정이 없으면 팀원이 브라우저에서 회원가입을 진행하게 안내합니다.
5. project link가 없으면 AI가 `vercel link` 흐름을 진행하고, 선택이 필요한 항목은 팀원에게 짧게 확인합니다.
6. 인증과 연결이 끝나면 AI가 다시 빌드 확인 후 production alias 배포를 계속합니다.

회원가입, 브라우저 로그인, 비밀번호 입력, 2FA 입력은 AI가 대신하지 않습니다. 하지만 CLI 준비, 로그인 시작, project link, 배포 재시도는 AI가 이어서 진행합니다.

인증 URL이 표시되면 AI는 가능한 경우 브라우저를 열어 해당 URL로 이동합니다. 동시에 팀원이 직접 열 수 있도록 클릭 가능한 링크를 함께 보여줍니다.

예시:

```text
Vercel 인증이 필요합니다.
URL: [Vercel 인증 페이지](https://...)
브라우저에서 로그인/회원가입/이메일 인증/2FA를 완료해 주세요. 인증이 끝나면 제가 이어서 배포합니다.
```

브라우저 제어가 불가능하면 URL을 복사하기 쉽게 위 형식으로 안내합니다. 로그인, 회원가입, 비밀번호 입력, 이메일 인증, 2FA, 계정 선택, 권한 승인은 팀원이 직접 진행합니다.

## Vercel env boundary

AI는 Vercel env 값을 임의로 생성하거나 덮어쓰지 않습니다.

허용:

- 필요한 env key 목록을 `.env.example`에 추가
- `vercel env ls`로 key 존재 여부 확인
- 개발자가 제공한 값으로 설정 절차 안내
- 필요 시 `vercel env pull` 또는 `vercel env run` 사용

금지:

- secret 값을 채팅/로그에 출력
- `echo SECRET | vercel env add ...` 방식 사용
- production env 임의 추가/수정/삭제
- `--force`, `--yes`로 env overwrite
- Supabase `service_role` key나 schoolp API secret을 브라우저 코드에 노출

## 배포 명령

```bash
npm run deploy
```

`npm run deploy`는 빌드 확인 후 Vercel CLI로 현재 작업을 production alias에 배포합니다.

첫 배포이거나 연결된 프로젝트가 불확실하면 AI는 배포 전에 Vercel 로그인 계정, team, project를 확인하고 팀원에게 짧게 보고합니다.

처음 배포하는 PC에서는 Vercel 로그인 또는 프로젝트 연결 안내가 나올 수 있습니다. AI가 로그인 절차를 시작하고, 브라우저가 자동으로 열리면 팀원이 본인 Vercel 계정으로 로그인합니다.

브라우저가 열리지 않으면 터미널에 표시된 로그인 URL을 직접 브라우저에 붙여넣어 인증합니다.

회원가입, 브라우저 로그인, 비밀번호 입력, 2FA 입력은 팀원이 직접 진행합니다. 인증이 끝나면 다시 Codex로 돌아와 AI가 배포를 계속합니다.

## 배포 전 저장 여부

저장하지 않은 변경사항이 있으면 AI는 먼저 아래처럼 묻습니다.

```text
배포 전에 현재 작업을 GitHub에 저장할까요?

1. 저장 후 배포하기 (추천)
2. 배포만 하기
```

- `저장 후 배포하기`: GitHub에 작업을 저장한 뒤 Vercel에 배포합니다.
- `배포만 하기`: GitHub에 저장하지 않고 Vercel에만 배포합니다.

사용자가 `저장하고 배포해줘`라고 말하면 질문 없이 저장 후 배포합니다.

사용자가 `배포만 해줘`라고 말하면 질문 없이 배포만 합니다.

저장하지 않고 배포한 경우 완료 보고에는 아래 항목을 포함합니다.

- `GitHub 미저장 배포`
- Vercel URL
- 마지막 Git commit 또는 `없음`
- 빌드 확인 시각

## Vercel postflight

배포 후 AI는 아래를 확인합니다.

- deployment URL
- production alias 갱신 여부
- `vercel inspect` 결과
- build 성공 여부
- 접속 가능 여부
- 필요 시 `vercel logs --level error --since 1h`

배포가 실패하면 같은 명령을 반복하지 않고 build logs와 runtime logs를 확인한 뒤 원인을 요약합니다.

## Codex 승인 팝업

Codex가 Vercel CLI 실행, 네트워크 접근, 샌드박스 밖 파일 쓰기 때문에 승인을 요청할 수 있습니다.

이 승인은 로컬 실행 보안 승인입니다. Vercel 프로젝트 설정 문제나 시작 파일 제한이 아닙니다.

승인 팝업이 뜨면 팀원에게 어떤 작업을 허용하는지 짧게 설명하고, 팀원이 승인한 뒤 계속 진행합니다.

## 실패 대응

빌드 오류가 있으면 다른 플랫폼으로 우회하지 말고 오류를 수정한 뒤 다시 Vercel 배포를 시도합니다.

같은 오류가 반복되거나 오류 원인이 인증, 권한, 결제, 개인정보, 운영 DB 전환, 운영 환경변수, 공식 도메인, 사용자 공개 반영과 관련되면 `개발자 확인 필요`로 정리합니다.

## 개발자 확인이 필요한 작업

- 공식 도메인 연결
- Vercel 환경변수 설정
- DB 전환
- 사용자 공개 반영
- 인증, 권한, 결제, 개인정보 연동
