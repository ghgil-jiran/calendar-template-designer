# 사용자 서비스 Runtime 패키지 공급 기준

- 패키지: `@calendar-publishing/user-service-runtime-bridge@0.1.0-alpha.1`
- 포함 템플릿: `desk-academic-standard@1.0.0`
- 대상 사용자 서비스 브랜치: `integration/runtime-v2`
- 상태: Shadow 연결 전용, 사용자 미리보기·PDF 교체 금지

## 목적

사용자 서비스가 달력 템플릿 에디터 전체 저장소, Legacy Project 또는 `index.html`에 의존하지 않고 공통 Template Package Runtime을 사용하게 한다. 이 패키지는 사용자 서비스 연결에 필요한 API와 버전 고정된 대표 탁상형 Template Package만 포함한다.

## 생성

달력 템플릿 에디터 저장소에서 전체 검사를 통과한 뒤 실행한다.

```bash
npm run build:user-service-runtime
```

결과는 `dist/user-service-runtime-bridge/`에 생성된다. 생성물의 `INTEGRITY.json`에는 JavaScript, 타입 선언과 Template Package JSON의 SHA-256이 기록된다. 생성 폴더는 소스 정본이 아니며 같은 커밋에서 언제든 다시 만들 수 있어야 한다.

## 사용자 서비스에 고정 설치

초기 Shadow 통합에서는 사용자 서비스 저장소의 `vendor/user-service-runtime-bridge/`에 생성 폴더를 복사하고 `package.json`에 로컬 의존성을 고정한다.

```json
{
  "dependencies": {
    "@calendar-publishing/user-service-runtime-bridge": "file:vendor/user-service-runtime-bridge"
  }
}
```

`npm install` 뒤에는 잠금 파일도 함께 커밋한다. 임의의 최신 버전을 네트워크에서 자동 선택하지 않는다.

## 사용자 서비스 호출 경계

```ts
import {
  assembleTemplatePackage,
  composeDeskAcademicPackageDocument,
  createUserServiceShadowDiagnosticReport,
  validateDeskAcademicPackageDocument
} from "@calendar-publishing/user-service-runtime-bridge";
```

Template Package JSON은 패키지의 `templates/desk-academic-standard/1.0.0/`에 있다. Next.js 빌드에서 JSON을 직접 import하거나 사용자 서비스의 고정된 개발 전용 URL에 복사한 뒤 `loadTemplatePackage`로 읽는다. 어느 방식을 쓰든 manifest와 template ID·버전 검사를 우회하지 않는다.

사용자 서비스의 기존 `MvpDatasetAdapter`가 반환한 Dataset을 `composeDeskAcademicPackageDocument`에 전달한다. 반환 문서는 Shadow 비교에만 사용하며 사용자 원본 문서나 `doc_render_state`에 다시 저장하지 않는다.

## 교체 금지 경계

- 기존 사용자 UI와 입력 흐름
- AI 일정 인식과 공휴일 코드 판정
- 음력·24절기 데이터 처리
- 기존 저장·복구 경로
- 기존 미리보기와 인쇄 PDF 경로
- PDF/X-4 확정 규격

실제 문서 진단과 육안 비교가 끝날 때까지 위 경로는 공통 Runtime 결과로 교체하지 않는다. 진단 보고서의 `approvedForReplacement`는 계속 `false`다.

## 업데이트 절차

1. 달력 템플릿 에디터에서 공통 모듈과 Template Package 검사를 통과한다.
2. 패키지를 다시 생성한다.
3. 사용자 서비스의 vendor 폴더를 새 생성물로 교체한다.
4. `INTEGRITY.json`, 패키지 버전과 템플릿 버전을 확인한다.
5. 사용자 서비스 타입 검사·테스트·빌드를 실행한다.
6. 실제 문서 Shadow 진단을 다시 생성해 이전 결과와 비교한다.

버전이나 해시가 섞인 상태에서는 사용자 서비스 연결을 진행하지 않는다.
