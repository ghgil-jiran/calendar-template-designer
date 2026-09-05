(function(root){
 const catalog=Object.freeze({id:'school-calendar-design-types',version:'0.2.0',schemaVersion:'design-type-catalog.v1',principle:'designer-finished-editable-start',styles:[
  {id:'editorial',name:'단정한 에디토리얼',description:'명확한 정보 위계, 얇은 선, 넓은 여백'},{id:'seasonal-watercolor',name:'사계절 수채화',description:'월별 자연색과 독립 계절 일러스트'},{id:'geometry',name:'모던 기하학',description:'도형·면 분할과 선명한 브랜드 색상'},{id:'photo-story',name:'사진 기록형',description:'학교·행사 사진을 중심으로 한 프레임 구성'},{id:'student-playful',name:'학생 친화 그래픽',description:'밝은 포인트와 둥근 도형, 교육 모티프'},{id:'premium-minimal',name:'프리미엄 미니멀',description:'절제된 색상과 타이포그래피 중심 구성'}
 ],expressionOptions:Object.freeze({
  variationRhythm:[['uniform','통일형'],['color','색상 변화형'],['seasonal','계절형'],['alternating','교대형'],['story','스토리형']],
  monthBackVariation:[['fixed','고정형'],['alternating','좌우 교대형'],['cycle','순환형']],
  decorationFamily:[['none','장식 없음'],['geometric','기하학'],['hand-drawn','손그림'],['paper-scrap','종이·스크랩'],['postmark','우표·스탬프'],['seasonal','계절 모티프'],['school-symbol','학교 상징']],
  material:[['clean-digital','깨끗한 디지털'],['matte-print','무광 인쇄'],['ivory-paper','미색 종이'],['rough-paper','거친 종이'],['vintage-print','빈티지 인쇄']]
 }),roles:{
  cover:{label:'표지',objects:'연도 · 학교 사진 · 교표 · 학교명·주소',use:'첫 인상과 학교 정체성을 강하게 보여주는 표지',caution:'사진과 학교 정보는 생성 이미지에 넣지 않고 별도 개체로 조정',layout:'split-cover',options:[['large-photo','대형 학교 사진형'],['photo-collage','사진 콜라주형'],['typography','타이포그래피 중심형'],['illustration','일러스트 중심형'],['split','사진·정보 분할형']]},
  annual:{label:'연력',objects:'연도 · 12개월 월력 · 월 이름 · 주말 색상',use:'한눈에 학사연도 전체 흐름을 확인하는 정보 면',caution:'12개월 글자 크기와 간격을 먼저 확보한 뒤 장식을 조정',layout:'annual-grid',options:[['balanced-4x3','4×3 균형형'],['open-grid','넓은 여백 격자형'],['header-band','상단 연도 띠형'],['split-info','월력·정보 분할형']]},
  'school-symbols':{label:'학교 상징',objects:'교표 · 교훈 · 교가 · 교목 · 교화',use:'학교 상징 정보를 읽기 쉬운 묶음으로 소개하는 면',caution:'교가와 긴 교훈의 실제 분량에 맞춰 카드 높이를 최종 조정',layout:'symbol-split',options:[['editorial-cards','에디토리얼 카드형'],['section-panels','섹션 분할형'],['heritage-document','전통 문서형'],['symbol-photo','상징 이미지 중심형']]},
  month:{label:'월력',objects:'월 제목 · 요일 · 날짜 격자 · 일정 · 미니 월력',use:'일정 가독성을 중심으로 매달 반복 사용하는 핵심 면',caution:'5·6주와 긴 학사일정에서도 겹치지 않는 공간을 우선 확보',layout:'month-calendar',options:[['calendar-led','달력 중심형'],['large-month-number','대형 월 숫자형'],['top-image-band','상단 이미지 띠형'],['split-calendar-image','이미지·달력 분할형'],['open-editorial','여백 중심 에디토리얼형']]},
  'month-back':{label:'월력 뒷면',objects:'이미지 · 뒷면 월력 · 미니 월력 · 플래너 · 메모 · 짧은 문구',use:'사진·정보·기록 기능을 월별 변화 규칙에 따라 조합하는 핵심 변주 면',caution:'자동 결과는 시작 구성이며 사진 수·크기·문구·세부 위치는 디자이너가 최종 조정',layout:'back-split',options:[['image-calendar','이미지+월력형'],['large-image','대형 이미지형'],['photo-collage','사진 콜라주형'],['planner','플래너 중심형'],['memo-calendar','메모+미니 월력형']]},
  'back-cover':{label:'뒷표지',objects:'학교명 · 교표 · 주소·연락처 · 마감 이미지',use:'표지의 조형 언어를 이어 세트를 안정적으로 마무리',caution:'필수 학교 정보가 배경과 충분히 구분되는지 최종 확인',layout:'closing-split',options:[['school-info','학교 정보형'],['cover-continuation','표지 연결형'],['photo-closing','마감 사진형'],['minimal-brand','미니멀 브랜드형']]}
 }});root.ACDLDesignTypeCatalog=catalog;
})(typeof window==='undefined'?globalThis:window);
