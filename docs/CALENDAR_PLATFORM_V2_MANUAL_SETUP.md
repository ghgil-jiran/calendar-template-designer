# V2 검토 환경 수동 설정

현재 코드 기반 저장: `feat/calendar-platform-v2`. 아직 V2 편집 화면이나 인쇄 전환이 구현된 상태는 아니다.

## Vercel 프로젝트 분리

기존 프로젝트를 수정하거나 이름을 바꾸지 않고, 같은 GitHub 저장소 `ghgil-jiran/calendar-template-designer`에서 두 프로젝트를 추가한다.

| 입력 | 에디터 | 사용자 서비스 |
| --- | --- | --- |
| 프로젝트 이름 | calendar-template-editor-v2 | calendar-customer-service-v2 |
| Root Directory | 저장소 루트 | apps/customer-workspace |
| Framework | Other | Next.js |
| Build Command | node scripts/build-vercel-static.mjs | npm run build |
| Output Directory | public | .next |
| Production Branch | feat/calendar-platform-v2 | feat/calendar-platform-v2 |

사용자 서비스 빌드는 저장소 루트의 에디터 소스도 읽는다. Vercel의 Root Directory 외부 소스 포함 옵션을 활성화해야 한다. 기존 프로젝트의 기본 브랜치나 운영 도메인은 변경하지 않는다.

처음 생성 시 V2 브랜치를 선택할 수 없으면 환경변수 없이 생성한 뒤 Settings의 Git 설정에서 Production Branch를 지정하고 해당 브랜치를 다시 배포한다. 첫 배포 결과는 V2 완료를 뜻하지 않는다.

**현재는 환경변수와 도메인을 복사하지 않는다.** 특히 Supabase service role, Storage 쓰기, 기존 Worker 연결 및 인쇄 작업 연결을 넣지 않는다. 첫 빌드가 환경변수 없이 실패하면 로그를 확인하고 필수 항목과 데이터 격리 방식을 먼저 정한다. 작동시키기 위해 운영 키를 임의로 복사하지 않는다.

두 프로젝트의 기본 접근 보호를 유지한다. 공개 접근이나 우회 링크를 만들 필요는 없다.

## 이어서 확인할 자료

- 생성한 두 프로젝트 이름 또는 주소, 빌드 성공·실패 상태.
- 실제 PC에서 Worker를 실행하는 폴더가 속한 GitHub 저장소 이름과 브랜치. 채팅에는 비밀번호·환경변수·키를 보내지 않는다.
- Supabase 원본과 자산 복구본은 아직 검증하지 않았다. 별도 보존 절차를 확인한 뒤 V2 쓰기 연결을 진행한다.

이 단계에서는 SQL 실행, 템플릿 게시, 운영 도메인 이동, 기존 프로젝트 삭제가 필요하지 않다.
