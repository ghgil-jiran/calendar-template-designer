# 신규 사용자 서비스: 첫 구현과 재사용 조사

2026-11-07. 설계서 v0.2 기준. 기존 사용자 서비스 코드와 템플릿 데이터는 수정하지 않는다.

## 보존 기준

- 에디터 원격 기준: preview/cover-prompt-20261008 @ dce1687c4c31c6bb9a8be7c7ba1c4d8b54c799bd
- 기존 사용자 서비스: review/snapshot-renderer-parity-20260927 @ 03137582e4ea4d3c1aef65e2b9e0a2bfd1849462
- 보존 브랜치: ghgil-jiran/-v1.1 / archive/user-service-mvp-20261107
- 신규 개발 브랜치: preview/customer-workspace-20261107
- 보존 브랜치는 전체 백업이 아니다. DB·Storage·환경 설정·로컬 파일·복원 확인은 미실시다. 기존 배포를 중단하거나 저장소를 archive하지 않았다.

## 실제 소스에서 확인한 경계

| 소스 | 관찰 | 처리 방향 |
|---|---|---|
| features/studio-runtime-core.js | project 전역 상태, renderPage/applyThemeTokens, DOM ID 직접 참조·초기화 | 실제 렌더러를 유지하면서 앱 상태·화면 초기화 의존성을 분리 |
| features/calendar-rendering.js | project와 CalendarDomain 등에 의존 | 달력 데이터·표현을 한 엔진으로 공유, 새 사용자용 달력 구현 금지 |
| features/preview-pdf-review-export.js | 실제 에디터 renderPage DOM을 인쇄에 사용 | 신규 모양 확인·Worker 렌더링을 이 계열에 연결 |
| persistence-project.js | 원본 직렬화와 편집 정책, 정규화는 일부 필드를 변경 | 원본을 보존하는 프로젝트 저장 경계를 먼저 추가, 기존 정규화 자동 적용 금지 |
| production-editor-adapter.js | 서비스 document를 에디터 프로젝트로 역변환·binding 해제 | 사용자 엔진 연결로 재사용하지 않음 |
| features/production-editor-workspace.js | 실제 에디터 재사용 사례이나 관리자 로그인·접수 교정에 결합 | 화면 초기화 순서만 참고, 관리자 API를 고객 서비스에 노출하지 않음 |
| user-service-dataset-bridge.js | 3월 시작·일요일·5행·v1.1 source를 검사 | 신규 서비스 경로에서 사용하지 않음 |
| dataset-domain-bridge.js | 원본 school/events 기반 도메인 기능 | 데이터 연결 시 선별 활용, 서비스 전용 모델 변환은 생략 |
| schedule-file-parser.js | XLSX/CSV/TXT 입력, Word/구형 XLS 미지원 | 재사용 후보. 파일 확장자·추출 오류·누락 확인 보완 필요 |
| api/templates.js | 관리자 목록/저장 API와 인쇄 접근 | 고객 템플릿 조회로 그대로 재사용하지 않음 |
| scripts/build-vercel-static.mjs | designer-studio를 public과 앱 경로로 복사 | 신규 Next 앱 배포와 분리. 루트 에디터 라우팅 변경 금지 |

## 첫 코드

packages/customer-project-session은 렌더러가 아닌 원본 프로젝트 저장 컨테이너다. acdl-project 자체를 보존하고 템플릿 버전·엔진 버전·프로젝트 수정 버전을 연결한다. 재편집·프로젝트 복사·최종본 고정의 기초를 제공한다. 렌더 노드 생성이나 스타일 추론, 기존 정규화·마이그레이션 호출을 하지 않는다.

이 모듈은 아직 실제 에디터나 신규 화면에 연결되지 않았다. 서버 저장·인증·편집 권한 검증·주문·인쇄 기능은 제공하지 않는다. 최종본 함수를 호출하는 것만으로 저장 또는 주문이 완료되지 않는다.

테스트: node --test packages/customer-project-session/test/*.test.mjs (10개 통과). 28면 테스트는 합성 데이터에 대한 보존 검사이며 샘플 A 실화면 일치 검증이 아니다.

## 다음 구현

1. apps/customer-workspace에 독립된 사용자 앱을 구성하고 디자이너 앱은 보존한다.
2. 공통 API 계약을 먼저 두고 게시된 템플릿 선택·필요 학교 필드·입력 초안을 연결한다. 템플릿 목록을 컴포넌트에 하드코딩하지 않는다.
3. 서버 저장은 실제 사용자 신원 전달·소유권 계약에 따라 연결한다. 인증되지 않은 사용자 자료 저장 API나 관리자 API 재사용은 하지 않는다.
4. 실제 에디터 프로젝트를 받는 mount/update/selectPage/export/dispose 경계를 분리한다. renderPage를 새로 작성하지 않는다. 에디터의 전역 상태·DOM 초기화에 관한 별도 조사와 회귀검사가 필요하다.
5. 샘플 A 원격 저장본과 동일 자료로 전체 28면을 확인하고, 사진 교체·저장·재열기를 연결한다.

## 별도 조사가 필요한 외부 연결

schoolp member/print 공식 계약은 기존 docs/API_CONTRACT.md에 있다. 신규 흐름에 필요한 신원 전달·최종본 전달 규격이 실제로 지원되는지 확인해야 하며 임의 endpoint를 만들지 않는다. 이 단계에서는 외부 API·운영 DB·환경변수·Production을 변경하지 않는다.

## 이번 단계 검증 범위

원격 최신 확인, 보존/개발 브랜치 생성, 소스 경계 조사, 프로젝트 컨테이너 10개 검사까지다. 신규 UI, 동일 엔진 연결, 실제 저장·재열기, PDF 생성·인쇄 품질은 아직 검증하지 않았다.
