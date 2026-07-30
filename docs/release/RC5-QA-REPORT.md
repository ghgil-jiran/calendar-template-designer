# RC5 QA Report

## 자동 검증
- Template Runtime TypeScript strict build: PASS
- 기존 Runtime 회귀 테스트: PASS
- RC5 RenderNode/RenderDiff 테스트: PASS
- Designer Integration strict build: PASS
- 기존 Adapter 통합 테스트: PASS
- SVG Publishing/Parity 테스트: PASS
- Designer Studio inline JavaScript syntax: PASS
- ZIP integrity: PASS

## 브라우저 수동 확인
1. Designer Studio 실행
2. 페이지 선택 후 `Runtime 미리보기` 클릭
3. 텍스트, 이미지, 월력 노드 위치 비교
4. 개체 이동/수정 후 미리보기를 다시 열어 반영 확인
5. Runtime 상태 배지의 페이지/진단 수 확인

## 제한
- PDF 바이너리 생성은 포함하지 않는다. RC5 PublishingRenderer는 PDF/PNG 파이프라인의 공통 중간 출력으로 SVG를 생성한다.
- Legacy Renderer 제거는 아직 수행하지 않았다.
- 자동 충돌 이동은 적용하지 않고 진단만 제공한다.
