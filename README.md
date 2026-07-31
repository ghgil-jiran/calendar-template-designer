# Canvas Publishing Platform

> 학교 출판물을 위한 도메인 기반 편집·렌더링 플랫폼  
> **첫 번째 제품: Academic Calendar Designer**

[![Release](https://img.shields.io/badge/release-1.0.0--beta.1-blue)](./docs/release/V1-BETA-RELEASE-NOTES.md)
[![Status](https://img.shields.io/badge/status-developer%20preview-orange)](./docs/release/KNOWN-ISSUES.md)

이 저장소는 학교 학사달력의 **템플릿 제작, 사용자 데이터 적용, 화면 미리보기, 인쇄용 출력**을 하나의 계약과 Runtime으로 연결하기 위한 프로젝트입니다.

현재 버전은 동료와 제품 방향 및 핵심 편집 기능을 공유하기 위한 **Developer Preview**입니다. 완성된 상용 서비스가 아니라, 이미 구현·검증된 Designer Studio와 Runtime 기반을 공개하고 다음 단계의 사용자용 Calendar Workspace 통합을 준비하는 릴리스입니다.

## 지금 확인할 수 있는 것

- 브라우저에서 바로 실행되는 **Designer Studio**
- 템플릿 페이지 및 오브젝트 편집
- 선택, 이동, 크기 조절과 편집 상태 관리
- Template + Dataset을 해석하는 **Template Runtime**
- `ResolvedDocument` 기반 화면 미리보기
- SVG Publishing Renderer 중간 출력
- Runtime·Integration·Editor Core·Renderer 회귀 테스트

## 제품 구조

```text
Canvas Publishing Platform
└─ Academic Calendar Designer
   ├─ Designer Studio          템플릿 디자이너용 편집 환경
   ├─ Calendar Workspace       학교 사용자용 제작 환경 (다음 단계)
   ├─ Template Runtime         템플릿과 데이터를 출력 모델로 해석
   └─ Publishing Renderer      화면 및 인쇄 출력
```

핵심 처리 흐름은 다음과 같습니다.

```text
Designer Studio
  → Template Contract + Dataset Contract
  → Template Runtime
  → ResolvedDocument
  → Screen Renderer / Publishing Renderer
```

## 3분 실행

### 1. 설치

```bash
npm install
```

### 2. 전체 검증

```bash
npm run verify
```

### 3. Designer Studio 실행

```bash
npm run dev
```

명령 실행 후 터미널에 표시되는 로컬 주소를 Chrome 또는 Edge에서 엽니다.

정적 파일을 직접 확인하려면 `apps/designer-studio/index.html`을 브라우저에서 열어도 됩니다.

## 저장소 구성

```text
apps/
  designer-studio/              실제 Designer Studio
  editor-core-demo/             편집 코어 동작 데모
packages/
  contracts/                    공통 계약 타입
  editor-core/                  선택·명령·히스토리·변형 상태
  calendar-domain/              학사달력 도메인 모델
  renderer-core/                편집 렌더링 기반
  template-runtime/             Template + Dataset 해석
  designer-runtime-integration/ 기존 편집기와 Runtime 연결
schemas/                         Runtime JSON Schema
samples/                         달력 유형 및 벡터 샘플
docs/                            제품·아키텍처·릴리스 문서
tools/                           실행 및 회귀 검사 도구
```

## 문서 읽기 순서

1. [제품 비전](./docs/product/00-VISION.md)
2. [현재 제품 범위](./docs/product/01-PRODUCT.md)
3. [플랫폼 아키텍처](./docs/architecture/01-PLATFORM-ARCHITECTURE.md)
4. [도메인 모델](./docs/domain/02-domain-model.md)
5. [로드맵](./ROADMAP.md)
6. [Beta 릴리스 노트](./docs/release/V1-BETA-RELEASE-NOTES.md)
7. [알려진 제한](./docs/release/KNOWN-ISSUES.md)

## 현재 릴리스

- 버전: **1.0.0-beta.1**
- 이름: **Foundation Developer Preview**
- 검증 명령: `npm run verify`
- 주요 진입점: `apps/designer-studio/index.html`
- 다음 목표: Calendar Workspace를 Runtime Contract에 연결

## 공개 시 유의사항

현재 편집 화면은 안정성을 위해 기존 편집 Renderer를 유지하고, Runtime Renderer는 미리보기·검증·출판 중간 모델의 기준으로 사용합니다. 두 Renderer의 완전한 통합은 후속 릴리스에서 진행합니다.

상세 내용은 [알려진 제한](./docs/release/KNOWN-ISSUES.md)을 참고하십시오.

## 우리학교인쇄와의 관계

이 저장소는 회원·주문·결제·배송 시스템을 대체하지 않습니다. 우리학교인쇄 서비스에서 호출할 수 있는 **달력 편집 및 출판 엔진**을 독립적으로 검증하는 프로젝트입니다.

- [서비스 경계](./docs/integration/SCHOOLP-PRINT-SERVICE-BOUNDARY.md)
- [주문 연동 초안](./docs/integration/PRINT-ORDER-INTEGRATION-DRAFT.md)
- [배포 단계](./docs/deployment/DEPLOYMENT-STAGES.md)

## 공유할 때 전달할 한 문장

> 학교 학사달력을 위한 템플릿 디자이너와 출판 Runtime을 만들고 있으며, 현재는 핵심 편집 기능과 출력 계약을 검증한 Developer Preview 단계입니다.
