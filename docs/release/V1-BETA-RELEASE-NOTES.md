# v1.0 Beta Release Notes

## 릴리스 의미

이 버전은 반복 데모를 하나의 제품 패키지로 정리한 첫 공개 베타다. Designer Studio가 Template의 Source of Truth 역할을 하고, Runtime은 UI와 독립적으로 `ResolvedDocument`를 생성한다.

## 제공 범위

- 브라우저 실행형 Designer Studio
- CalendarType 및 사용자 정의 유형
- 시작 템플릿과 복수 크기 프리셋
- Template Runtime, Binding, Layout, Collision 진단
- Legacy Project Adapter
- Runtime Screen Preview
- SVG Publishing Renderer
- Runtime 입력·출력 JSON Schema

## 의도적으로 유지한 호환 계층

기존 편집 화면 Renderer는 베타에서 유지한다. Runtime Renderer는 출력 모델과 미리보기의 기준이지만, 선택·드래그·리사이즈 등 전체 편집 상호작용을 아직 단독으로 담당하지 않는다. 이는 미완성을 숨긴 것이 아니라 회귀 위험을 줄이기 위한 단계적 전환 결정이다.

## 권장 검증 흐름

1. 기본 유형 4종과 크기 프리셋 확인
2. 새 템플릿 생성
3. 텍스트·이미지·월력 개체 편집
4. Runtime 상태 확인
5. Runtime 미리보기와 편집 화면 비교
6. JSON 저장 후 재불러오기
7. `npm run verify` 실행
