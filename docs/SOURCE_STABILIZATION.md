# Source Stabilization

## 기준본

개발 기준본은 GitHub `main` 하나입니다. 오래된 작업 폴더나 임시 작업본은 참고 자료일 뿐, 다음 수정의 출발점으로 사용하지 않습니다. 저장하지 않은 로컬 변경은 삭제하거나 합치지 않고 별도로 보존합니다.

## 새 작업 시작 절차

```bash
npm ci
npm run build
```

`npm ci`는 `package-lock.json`에 기록된 TypeScript를 포함한 개발 의존성을 설치합니다. 따라서 별도 작업본에서 `tsc`가 없다는 메시지가 나오면 소스 문제로 판단하기 전에 `npm ci` 실행 여부를 먼저 확인합니다.

`npm run build`는 다음을 한 번에 확인합니다.

1. 기존 정적 Designer Studio의 스타일 보호 규칙
2. Template Runtime 및 연동 패키지
3. Contracts, Editor Core, Calendar Domain, Renderer Core
4. Designer Studio 전체 회귀 검사
5. 포인터 상호작용 검사
6. 인라인 JavaScript 구문 검사

## 이번에 바로잡은 문제

- Template Runtime이 저장소에 존재하지 않는 테스트 파일을 실행하던 문제
- 일부 Designer Studio 회귀 검사가 표준 검증에서 빠져 있던 문제
- 실행되지 않던 회귀 검사 파일의 잘못된 정규식
- 새 달력 만들기 상태를 완전히 초기화하는 함수 누락
- 같은 패키지 검사를 중복 실행하던 검증 명령

## 남은 구조 개선

현재 `apps/designer-studio/index.html`은 약 500KB 규모이며 여러 시기의 HTML, CSS, JavaScript가 한 파일에 누적되어 있습니다. 최종 미리보기 진입부가 이전 버튼 연결을 교체해 현재 동작은 보호되고 있지만, 동일 기능의 과거 구현을 이해하기 어려운 상태는 남아 있습니다.

다음 구조 개선은 아래 순서로 별도 진행합니다.

1. Preview 실행과 화면 구성을 독립 모듈로 분리
2. Wizard 상태와 화면 제어를 `wizard-flow.js`로 일원화
3. Template Library 렌더링과 저장 로직 분리
4. Editor Interaction과 페이지 렌더링 분리

이 작업은 화면 디자인이나 기능을 동시에 바꾸지 않고, 각 단계마다 기존 회귀 검사를 먼저 고정한 뒤 진행합니다.
