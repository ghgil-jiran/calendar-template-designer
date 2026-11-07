# GitHub 공개 절차

현재 저장소 원격 주소:

```text
https://github.com/ghgil-jiran/calendar-template-designer.git
```

## 1. 변경 확인

```bash
git status
git diff --stat
```

## 2. 전체 검증

```bash
npm install
npm run verify
```

## 3. 커밋

현재 작업 중인 Sprint 2 코드와 공개 문서를 한 번에 첫 공유 버전으로 묶는 경우:

```bash
git add .
git commit -m "Release 1.0.0-beta.1 developer preview"
```

## 4. GitHub 업로드

```bash
git push origin main
```

기본 브랜치가 `master`라면 마지막 명령만 다음과 같이 변경합니다.

```bash
git push origin master
```

## 5. 태그 생성

```bash
git tag -a v1.0.0-beta.1 -m "Foundation Developer Preview"
git push origin v1.0.0-beta.1
```

## 6. GitHub Release 작성

- Tag: `v1.0.0-beta.1`
- Title: `1.0.0-beta.1 — Foundation Developer Preview`
- Body: `docs/release/V1-BETA-RELEASE-NOTES.md` 내용 사용
- Pre-release 체크: 활성화

## 7. 동료 공유 문구

```text
학사달력 템플릿 디자이너와 출판 Runtime의 첫 Developer Preview를 공유합니다.
현재는 핵심 편집 기능과 출력 계약을 확인할 수 있으며, 다음 단계에서 학교 사용자용 Calendar Workspace를 연결할 예정입니다.
README의 실행 방법으로 확인해 보시고, 실제 제작 흐름에서 부족한 점을 알려주세요.
```
