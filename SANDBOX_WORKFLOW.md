# Sandbox Workflow

학교사업팀 팀원은 Git, FTP, 서버 반영 작업을 직접 하지 않는다.

팀원은 AI에게 FTP 업로드, 서버 접속, 사용자 공개 반영을 요청하지 않는다.

단, 회사/집/다른 PC에서 이어서 작업해야 하면 AI에게 `작업 저장해줘`, `최신 작업 불러와줘`라고 요청할 수 있다. AI는 안전 절차 안에서 GitHub private 저장소만 사용한다.

현재 작업을 배포해야 하면 AI에게 `배포해줘`라고 요청할 수 있다. Vercel production alias는 팀 공유용 화면 검토 링크이며, 사용자 공개 반영이나 서비스 오픈이 아니다.

## 시작 방식

표준 방식:

```text
팀원이 다운로드 페이지에서 ZIP 다운로드
압축 해제
압축 해제한 폴더를 Codex/Claude에서 열기
AI_START_HERE.md를 먼저 읽게 한 뒤 개발 시작
```

통제 운영 방식:

```text
개발자가 팀원별 sandbox 폴더 생성
개발자가 필요한 환경 파일과 안내 제공
팀원은 제공받은 sandbox 폴더를 Codex/Claude에서 열기
```

시작 파일 기준:

- schoolp 프로젝트는 `schoolp-nextjs-app` Next.js 시작 파일을 사용한다.
- 화면 중심 작업도 Next.js 기준으로 진행한다.
- 데이터를 보여주는 화면은 항상 `/api/*`(BFF)를 거치고, 저장이 필요한 데이터는 Supabase Postgres로 실제 저장한다(필요할 때만·최소로).
- 위험 기능 구현은 개발자 확인 후 진행한다.

예시 sandbox 이름:

```text
schoolp-sc01-sandbox
schoolp-sc02-sandbox
schoolp-sc03-sandbox
```

## 팀원이 하는 것

팀원은 제공받은 폴더 또는 압축 해제한 폴더를 Codex/Claude에서 연다.

팀원은 AI에게 이렇게 말한다.

```text
AI_START_HERE.md를 먼저 읽고 이 프로젝트 규칙에 맞춰 작업해줘.
```

팀원은 FTP/SFTP/서버 반영 작업을 요청하지 않는다.

작업 후 GitHub에 저장해야 하면 AI에게 아래처럼 요청한다.

```text
작업 저장해줘.
```

다른 PC에서 이어서 작업해야 하면 AI에게 아래처럼 요청한다.

```text
최신 작업 불러와줘.
```

진행상황 공유가 필요하면 AI에게 아래처럼 요청한다.

```text
배포해줘.
```

AI는 Vercel에 현재 작업을 배포하고 완료 후 접속 URL을 알려준다.

## 로컬 실행

로컬 주소는 항상 `http://localhost:3000`을 사용한다.

AI에게 실행을 요청할 때는 3000번 포트로만 실행하게 한다. 3000번 포트가 사용 중이면 다른 포트로 우회 실행하지 않고 기존 dev server를 종료한 뒤 다시 실행한다.

Windows에서 Node.js 또는 npm을 찾지 못하면 Node.js LTS 설치가 필요하다. 설치 후 Codex와 PowerShell을 완전히 다시 열어야 한다.

Windows에서는 `start-windows.cmd`를 먼저 실행한다. 이 파일은 Node/npm 확인, 설치 안내, 3000번 포트 정리, 의존성 설치, 로컬 실행을 순서대로 진행한다.

## 결과 반영

팀원이 sandbox에서 화면과 기능을 확인한 뒤 개발자에게 전달한다.

권장:

- 변경 파일 목록과 작업 요약 전달
- 화면 캡처 전달
- sandbox 폴더 또는 정리된 sandbox zip 전달
- `HANDOFF.md` 양식 사용

비추천:

- 팀원이 FTP로 서버에 직접 업로드
- 팀원이 GitHub 또는 GitLab에 직접 push
- 팀원이 운영 서버에 직접 접속
- 팀원이 Vercel 외 다른 플랫폼으로 우회 배포

개발자는 전달받은 결과를 검토한 뒤 별도 릴리스 절차로 사용자 공개 반영을 진행한다.

Vercel 배포는 화면 검토용이다. 공식 도메인 연결, 운영 환경변수 설정, DB 전환, 사용자 공개 반영은 개발자가 확인한다.

## 전달 ZIP 포함 금지

팀원이 sandbox를 ZIP으로 전달할 때 아래 파일과 폴더는 포함하지 않는다.

```text
.env
.env.local
.env.*.local
*.db
*.db-journal
*.sqlite
*.sqlite3
node_modules
.next
dist
.vite
coverage
.git
.vercel
schoolp-nextjs-app.zip
schoolp-nextjs-app/
legacy
backup
old
*.log
.DS_Store
```

`.gitignore`는 Git에만 적용된다. 폴더를 직접 압축하면 위 파일들이 들어갈 수 있으므로 전달 전 반드시 확인한다.

## GitHub 저장과 Vercel 배포 방식

작업 저장이 필요하면 팀원이 AI에게 `작업 저장해줘`라고 요청한다.

AI는 GitHub CLI 로그인 상태를 확인하고, 필요하면 private 저장소를 만든 뒤 commit/push한다.

GitHub 저장은 회사/집/다른 PC에서 이어서 작업하기 위한 것이다. 사용자 공개 반영이나 서비스 오픈이 아니다.

진행상황 공유 URL이 필요하면 팀원이 AI에게 `배포해줘`라고 요청한다.

AI는 `npm run deploy`를 기준으로 Vercel production alias에 현재 작업을 배포한다.

Vercel의 production URL이 갱신되더라도 사용자 공개 반영이나 서비스 오픈은 아니다.

처음 배포하는 PC에서는 Vercel 로그인 또는 프로젝트 연결 안내가 나올 수 있다. 브라우저가 자동으로 열리면 본인 Vercel 계정으로 로그인한다. 브라우저가 열리지 않으면 터미널에 표시된 로그인 URL을 직접 브라우저에 붙여넣어 인증한다. 인증이 끝나면 다시 Codex로 돌아와 배포를 계속한다.

공식 도메인 연결, 운영 환경변수 설정, DB 전환, 사용자 공개 반영은 팀원이 직접 하지 않는다.

권장 1단계 방식:

```text
팀원이 GitHub 저장소 URL 또는 sandbox zip 전달
개발자가 소스 확인
개발자가 변경 파일/빌드/보안 확인
개발자가 별도 릴리스 절차로 사용자 공개 반영
```

반복 작업이 많아지면 업로드 포털을 만들 수 있다.

```text
팀원이 웹페이지에 zip 업로드
서버가 안전한 임시 공간에 압축 해제
자동 검사 실행
성공 시 preview 도메인에 배포
실패 시 오류 리포트 표시
개발자는 최종 반영 여부 검토
```

업로드 포털을 만들 때 최소 기준:

- 인증된 팀원만 업로드 가능
- 파일 크기와 파일 개수 제한
- zip entry 경로 검증
- symlink, nested zip 거부
- 격리된 임시 디렉터리에만 압축 해제
- production secret 없는 빌드 환경 사용
- preview 자동 만료/삭제
- 업로드 작업자, 시간, 파일 hash 기록
- 개발자 승인 전 운영 반영 금지

초기에는 팀원이 3명이고 서비스 수가 적은 동안 개발자 수동 검토가 더 안전하다.
