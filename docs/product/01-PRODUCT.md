# Academic Calendar Designer

## 현재 제공 범위

### Designer Studio

템플릿 디자이너가 달력 페이지와 오브젝트를 구성하고, 편집 상태를 저장하며 Runtime 해석 결과를 확인하는 환경입니다.

### Template Runtime

Template과 Dataset을 입력받아 화면 및 출판 Renderer가 사용할 `ResolvedDocument`를 생성합니다.

### Publishing Preview

Runtime 결과를 화면과 SVG 형태로 확인하여 편집 결과와 출력 모델 간 차이를 점검합니다.

## 현재 사용 시나리오

1. Designer Studio를 실행합니다.
2. 새 템플릿을 만들거나 기존 JSON을 불러옵니다.
3. 페이지와 오브젝트를 선택하고 이동하거나 크기를 조절합니다.
4. Runtime 상태와 미리보기를 확인합니다.
5. 템플릿 JSON을 저장하고 후속 Workspace 연동에 사용합니다.

## 릴리스에 포함되지 않은 것

- 실제 학교 계정과 조직 권한
- 주문·결제·배송 연동
- 완성형 PDF 인쇄 파일 생성
- 다중 사용자 협업
- AI 자동 편집
- 운영 환경 배포

이 항목들은 현재 버전의 결함을 숨기기 위한 목록이 아니라, Developer Preview와 후속 제품 범위를 명확히 구분하기 위한 것입니다.

## 다음 제품 단계

다음 릴리스의 중심은 **Calendar Workspace 통합**입니다.

- 템플릿 선택
- 학교명·교표·학교 전경 적용
- 학사일정 Dataset 적용
- 월별 이미지와 텍스트 입력
- 최종 미리보기
- 저장 및 다시 불러오기
