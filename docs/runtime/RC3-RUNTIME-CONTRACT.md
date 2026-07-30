# RC3 Runtime Contract

## 목적
Designer Studio, 사용자 Workspace, 미리보기, PDF·이미지 출력이 같은 해석 결과를 사용하도록 Template 해석 책임을 UI에서 분리한다.

## 고정 파이프라인

```text
Template Contract + Dataset Contract
            ↓
      BindingResolver
            ↓
       ObjectResolver
            ↓
        LayoutEngine
            ↓
     RenderModelBuilder
            ↓
      ResolvedDocument
            ↓
Screen / Print / Thumbnail Renderer
```

## 경계
- Editor는 Template과 Dataset을 수정한다.
- Runtime은 두 입력을 순수하게 해석한다.
- Renderer는 ResolvedDocument만 입력받는다.
- Runtime은 DOM, Canvas, PDF 라이브러리에 의존하지 않는다.

## RC3 구현 범위
- 점 표기와 배열 인덱스를 지원하는 BindingResolver
- 페이지·개체 해석
- 경계 진단과 기본 텍스트 Auto-fit
- zIndex 정렬
- target별 공통 ResolvedDocument 생성
- TypeScript 빌드·회귀 테스트

## RC4 이관 항목
- 기존 `index.html` 렌더링을 Runtime 어댑터 뒤로 이동
- 달력 그리드·기간 일정·Master 전개 Resolver 추가
- 실제 폰트 계측 기반 Text Layout
- 이미지 fitting/cropping 모델
- PDF Renderer 연결
