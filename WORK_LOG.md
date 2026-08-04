# Work Log

## 2026-08-04 — 월력용 명언 자유 배치 수정

- 명언 개체에만 적용되던 충돌 회피 자동 배치 제거
- 명언 개체도 다른 개체처럼 겹쳐서 자유롭게 배치하도록 통일
- 이동·크기 조절 시 선택한 개체만 변경되는 회귀 검사 추가
- 레이어의 `맨 앞으로`·`맨 뒤로` 동작은 그대로 유지
- Studio 검사 55개와 전체 패키지 검사 통과

## 2026-08-04 — 전체 소스 안정화

- 원격 `main` 커밋 `e714321`을 기준으로 기존 로컬 변경과 분리된 작업본 생성
- `npm ci`로 잠금 파일 기준 TypeScript 의존성 설치
- Template Runtime에 실제 테스트가 없는데 존재하지 않는 테스트 파일을 실행하던 오류 수정
- Runtime 바인딩 및 계약 버전 검사 2개 추가
- 루트의 모든 Designer Studio 회귀 검사가 표준 검증에서 실행되도록 통합
- 기존 회귀 검사 정규식 오류와 마법사 초기화 함수 누락 수정
- 패키지 TypeScript 컴파일, 패키지 검사, Studio 회귀 검사 45개, 인라인 스크립트 17개 검사 통과
- 화면 구성과 기존 편집 기능은 변경하지 않음

## 2026-07-30 — schoolp r015 안전 적용

- 정본 ZIP의 AI_START_HERE.md, STARTER_VERSION.md, CHANGELOG.md, AI_COMMANDS.md, docs/UPDATE_APPLY_GUIDE.md, starter-manifest.json 확인
- 현재 프로젝트를 구현 진행 중인 정적 Designer Studio + TypeScript Runtime으로 진단
- safeApply 범위의 문서, 스킬 폴더, 설정, 훅, scripts를 반영
- `.schoolp/starter-state.json`에는 appliedStandard r015만 반영하고 디자인 토큰 계약은 활성화하지 않음
- 기존 UI, 스타일, 기능, `apps/designer-studio/index.html` 보존
- 우리학교인쇄 서비스 경계, 주문/파일 연동 초안, 배포 단계를 문서화
- `npm run style:check`, `npm run build` 검증 예정
