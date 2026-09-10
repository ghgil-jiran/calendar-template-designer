# Work Context

## 현재 이어서 할 작업 · 2026-09-10

- 작업 기준은 `ghgil-jiran/calendar-template-designer`의 `main@9405814`이며 AI 디자인 생성 고도화 2차를 진행한다.
- 현행 공식 디자인 스타일은 에디토리얼 그래픽, 캠퍼스 다큐멘터리, 모듈러 컬러 시스템, 컨템퍼러리 일러스트레이션, 디지털 오라 모션, 한국적 모던 그래픽의 6종이다.
- 과거 12개 스타일은 폐기하되 기존 저장 템플릿과 Published Package 참조를 먼저 조사하고 자동 변경하지 않는다.
- AI 생성 조건에 실제 편집 개체의 유형, 중요도, 가독성, 점유율, 형태, 보호 강도, 안전 여백, 겹침 허용 방식을 연결했다.
- 월력 뒷면은 사진·달력·플래너·메모 개체가 실제 생성되기 전에도 선택한 구성의 예정 좌표와 크기를 AI 보호 조건에 포함한다.
- AI 프롬프트는 중요한 달력·학교 정보 개체를 페이지 구성의 중심축으로 취급하고, 사진 영역에는 분위기만 겹치며, 보호 좌표를 흰 카드나 프레임으로 표현하지 못하게 한다.
- 변경 파일은 `apps/designer-studio/features/ai-design-runtime.js`, `api/ai-design-generate.js`, `apps/designer-studio/ai-design/prompts/school-calendar-design@0.14.0.js`, `tests/ai-design-live-generation.test.mjs`다.
- 전체 `npm run build`가 통과했다. Studio 회귀검사 367개, 전체 패키지 검사, Sprint 2 제품 검사와 스타일 검사가 모두 통과했다.
- Supabase 변경은 없다.

## 다음 작업

1. 현재 변경을 GitHub에 저장하고 Vercel Production 검토 링크에 반영한다.
2. Production에서 대표 디자인을 새로 생성해 개체 뒤 대비, 주요 소재 위치, 사진·플래너 영역의 실제 노출 정도를 확인한다.
3. 과거 12개 스타일의 코드·저장 데이터·Published Package 참조 현황을 조사해 안전한 폐기 범위를 확정한다.
4. 시작 유형에 부족한 이미지 프레임, 복수 사진 콜라주, 연간 정보, 학사 일정 개체를 실제 편집 개체로 추가한다.
5. 현행 6개 스타일이 모든 편집 개체에 개체별 스타일을 제공하도록 적용 계약을 확장한다.

## 보존 원칙

- 기존 Published Package와 저장 템플릿을 자동 변경하거나 교체하지 않는다.
- 학교 정보, 달력, 일정, 교표, 사진 프레임은 AI 이미지에 굽지 않고 편집 개체로 유지한다.
- 사용자 미커밋 변경과 `tmp/`는 폐기하거나 저장 범위에 포함하지 않는다.
- Supabase 변경이 필요하면 SQL migration을 작성하고 사용자가 직접 적용한다.
