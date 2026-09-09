(function(root){
 const commonGuideline={
  title:'탁상달력 공통 AI 이미지 생성 및 디자인 지침',
  text:'AI 출력 캔버스는 도련까지 채우되 그림이 화면 전체를 채울 필요는 없습니다. 넓은 여백과 수평·수직 색면, 모듈, 곡선, 원형 흐름, 작은 크롭 포인트 중 페이지에 맞는 한 가지 조형 문법을 선택합니다. 대각선은 필요한 경우에만 제한적으로 사용하고 세트 전체에 반복하지 않습니다. 학교 전경 사진, 학사 일정, 교가, 연혁 등 실제 학교 콘텐츠가 중심이며 AI는 현대적인 배경·색면·그래픽·일러스트만 생성합니다. 월력 앞면은 달력 가독성을 최우선으로 하고, 투명한 월력 격자 아래로 연속 배경이 보이도록 하며 색상이나 작은 장식만 절제해 변화시킵니다. 월력 뒷면은 선택한 구성과 사진 사용 방식에 맞춰 별도로 설계합니다. 실제 개체 보호 좌표가 항상 우선하며 날짜, 격자, 헤더, 플래너, 사진 프레임, 학교 정보, 로고, 교훈과 읽을 수 있는 문자·숫자는 생성하지 않습니다. 간지는 같은 스타일을 유지하면서 실제 순번·앞뒤·용도마다 서로 다른 이미지로 생성합니다.',
  lockedRules:['finished-size-260x180mm','production-size-266x186mm','bleed-3mm','editable-content-not-rasterized','binding-safe-area','actual-page-structure-first']
 };
 const pageGuidance=(cover,annual,divider,month,monthBack,backCover)=>({cover,annual,divider,month,'month-back':monthBack,'back-cover':backCover});
 const styles=[
  {id:'editorial-graphic',name:'에디토리얼 그래픽',description:'비대칭 컬럼·선·색면과 과감한 크롭으로 만드는 문화 포스터형 조형 시스템',colors:['#f7f5ef','#1f3557','#de5b4f','#e8b84a'],guidance:pageGuidance(
   ['타이포그래피와 학교 사진이 들어갈 자리를 전제로 한 비대칭 컬럼·선·색면','contemporary editorial graphic system, asymmetric columns, rules and cropped color fields, designed for later bold typography and school photography, no generated text'],
   ['12개월 정보 흐름을 보조하는 넓은 여백과 짧은 선·색면의 편집 리듬','large clean negative space with sparse editorial rules and color fields supporting the annual overview, no grid or header bar'],
   ['간지 목적마다 컬럼 폭·색면 크롭·선의 방향을 새롭게 조합한 문화 포스터형 구성','unique culture-poster-like divider using varied column proportions, cropped color fields and directional rules, no typography'],
   ['투명한 월력 격자 아래로 이어지는 밝은 바탕과 한 가지 작은 편집 포인트','bright continuous ground visible beneath the transparent calendar grid, with only one restrained editorial accent per month'],
   ['사진·플래너·일러스트 구성에 맞춰 컬럼·선·색면이 개체 사이를 연결하는 편집 구성','editorial columns, rules and color fields connecting the selected editable components without drawing frames or cards'],
   ['표지의 컬럼과 색면 비례를 변형해 학교 정보가 선명한 마감 구성','closing composition transforming the cover column and color-field proportions around calm school-information zones'])},
  {id:'campus-documentary',name:'캠퍼스 다큐멘터리',description:'실제 학교 사진을 주인공으로 두고 캡션 리듬·표식·색 보정 분위기만 더하는 사진 시스템',colors:['#f5f6f3','#244b62','#d6a34a','#bf584c'],guidance:pageGuidance(
   ['실제 학교 사진을 크게 보여줄 여백과 다큐멘터리 표식·짧은 선의 절제된 배경','documentary layout prepared for a real school photograph, sparse registration-like graphic marks and short rules, no invented photo or text'],
   ['연력 정보를 방해하지 않는 밝은 바탕과 작은 사진기록형 색상 표식','bright unobtrusive ground with a few small documentary color markers, no grid, photo, or caption text'],
   ['실제 학교 자료와 사진을 주인공으로 두는 기록물 편집 리듬, AI 사진 생성 금지','documentary divider atmosphere framing later real school assets through sparse marks and color rhythm, never generate a photograph'],
   ['투명한 월력 격자 뒤의 깨끗한 바탕에 월별 작은 기록 색상 또는 표식만 변화','clean ground visible through the transparent calendar grid, only one small month-specific documentary color marker'],
   ['사용자·학교 사진이 항상 주인공이고 AI는 색상 분위기와 그래픽 표식만 제공','real replaceable school photography remains dominant; AI provides only restrained color atmosphere, crop guidance and documentary graphic marks'],
   ['표지의 기록형 표식과 색상 체계를 축소해 학교 정보 중심으로 마감','quiet documentary closing field with sparse marks and clear school-information space, no invented photograph'])},
  {id:'modular-color-system',name:'모듈러 컬러 시스템',description:'월력 격자와 결합되는 색상 블록과 구조적 비례로 월별 차이를 만드는 시스템',colors:['#f6f7f3','#2458a6','#e55445','#e5b72f'],guidance:pageGuidance(
   ['단단한 비례의 모듈 색면과 넓은 밝은 공간이 만드는 현대적 브랜드 표지','modern brand composition using proportioned modular color fields and large bright space, no paper objects or faux UI'],
   ['연력 배열과 충돌하지 않는 저대비 모듈 간격과 작은 색상 블록','low-contrast modular spacing and sparse color blocks supporting the annual overview, no grid or panels'],
   ['목적별로 면적 비율·결합 방식·색상 순서를 달리한 독립적 모듈 구성','unique divider built from a different modular proportion, connection rule and color sequence, no text'],
   ['투명한 월력 격자 아래에 보이는 단색 바탕과 한두 개의 구조적 색상 블록','solid light ground visible beneath the transparent calendar grid with one or two structural color blocks only'],
   ['사진·플래너·메모 개체의 실제 비례와 정렬축을 이어주는 모듈형 색면','modular fields aligned to actual editable components without outlining, imitating, or enclosing them'],
   ['표지의 모듈 비례를 단순화한 강한 브랜드 마감과 정보 여백','simplified closing arrangement of the cover modular proportions with clear school-information space'])},
  {id:'contemporary-illustration',name:'컨템퍼러리 일러스트레이션',description:'학생·수업·과학·음악·스포츠를 단순한 현대적 형태로 표현하는 고정 화법',colors:['#f7f4ea','#3678b8','#e96b55','#e6b94d'],guidance:pageGuidance(
   ['단순한 인체·학교생활 형태와 대담한 크롭, 일관된 평면 벡터 화법','contemporary flat editorial illustration with simplified school-life forms, bold crop and consistent shape language, no photorealism'],
   ['연력 바깥의 작은 추상 교육 모티프와 넓은 밝은 공간','large bright annual field with a few small abstract learning motifs in one fixed illustration language'],
   ['배움·공동체·음악·과학·스포츠를 간지 목적에 맞게 해석한 독립 장면','unique purpose-led illustration of learning, community, music, science or sport in the same strict flat style'],
   ['투명한 월력 격자 밖 실제 빈칸에만 놓이는 하나의 작은 현대 일러스트','one small contemporary illustration only in genuine unused space, with the transparent calendar grid remaining dominant'],
   ['월별 독립 학교생활 장면을 같은 인물 비례·선·면·팔레트로 유지','cohesive monthly school-life illustration series using identical figure proportions, line weight, shape grammar and palette'],
   ['표지 장면의 형태와 색을 축약한 작은 마감 일러스트','small closing illustration resolving the cover shapes and colors around clear school information'])},
  {id:'digital-aura-motion',name:'디지털 오라 & 모션',description:'저채도 빛의 방향성과 운동감으로 청소년의 속도와 에너지를 표현하는 디지털 시스템',colors:['#f6f7fb','#596bd6','#78c9d2','#f0a36b'],guidance:pageGuidance(
   ['한 방향으로 흐르는 오라와 속도감 있는 빛의 궤적, 넓은 정지 공간','directional low-chroma aura and restrained motion trails balanced by large still space, no glass card or UI'],
   ['연간 흐름을 암시하는 아주 옅은 빛의 이동과 깨끗한 정보 공간','very pale directional light movement suggesting a year-long flow, clean annual field, no panel'],
   ['간지 목적마다 속도·궤적·빛의 중심을 다르게 설계한 독립적 오라','unique divider aura with purpose-specific velocity, trajectory and light center, no repeated diagonal template'],
   ['투명한 월력 격자 아래로 이어지는 거의 흰 바탕과 작은 빛의 방향 변화','near-white ground visible through the transparent calendar grid with one subtle monthly motion cue'],
   ['개체 사이의 이동 방향을 연결하는 저채도 오라와 부드러운 운동 궤적','low-chroma aura and soft motion trajectory connecting actual components, no white cards, UI or frames'],
   ['표지의 운동감을 감속시켜 하나의 조용한 빛으로 닫는 구성','closing aura that decelerates the cover motion into one quiet light field'])},
  {id:'korean-modern-graphic',name:'한국적 모던 그래픽',description:'조각보 면 분할·창살 비례·먹선 운동을 재료감 없이 현대적으로 추상화한 시스템',colors:['#f5f2ea','#24505b','#c8574e','#d6a33e'],guidance:pageGuidance(
   ['조각보 면 분할과 창살 비례, 한 번의 먹선 운동을 평면 그래픽으로 추상화','contemporary Korean graphic abstraction using jogakbo plane division, lattice proportion and one kinetic ink-like line, no paper texture'],
   ['연력 배열을 받치는 절제된 한국적 비례와 옅은 면 분할','restrained Korean proportional rhythm and pale plane division supporting the annual overview, no traditional object'],
   ['간지 목적마다 조각보 비례·창살 간격·먹선 운동의 조합을 다르게 구성','unique divider varying jogakbo proportion, lattice interval and kinetic ink-line movement, no heritage decoration'],
   ['투명한 월력 격자 아래 밝은 바탕과 한 가지 절제된 면 분할 또는 선 운동','bright ground visible beneath the transparent calendar grid with one restrained plane division or line movement'],
   ['편집 개체의 실제 축에 반응하는 현대적 조각보 면과 유연한 먹선 운동','modern jogakbo planes and kinetic ink-like lines responding to actual editable axes, no frames or traditional props'],
   ['표지의 한국적 비례와 선 운동을 압축한 단정한 마감','clean closing composition compressing the cover Korean proportions and line movement'])},
 ];
 const roles={
  cover:{label:'표지',objects:'연도 · 학교 사진 · 교표 · 학교명·주소',use:'첫 인상과 학교 정체성을 보여주는 면',caution:'학교 콘텐츠와 문자는 별도 편집 개체로 유지',layout:'split-cover',options:[['large-photo','대형 학교 사진형'],['photo-collage','사진 콜라주형'],['typography','타이포그래피 중심형'],['illustration','일러스트 중심형'],['split','사진·정보 분할형']]},
  annual:{label:'표지 뒷면·연력',objects:'연도 · 12개월 월력 · 월 이름 · 주말 색상',use:'학사연도 전체 흐름을 확인하는 정보 면',caution:'12개월 정보 영역을 이미지에 그리지 않음',layout:'annual-grid',options:[['balanced-4x3','4×3 균형형'],['open-grid','넓은 여백 격자형'],['header-band','상단 연도 띠형'],['split-info','월력·정보 분할형']]},
  divider:{label:'간지',objects:'학교 상징 · 교가 · 연혁 · 안내 · 선택 콘텐츠',use:'실제 템플릿에 추가된 모든 간지에 공통 스타일을 적용',caution:'간지 수를 고정하지 않고 위치·순번·앞뒤·용도에 따라 각각 생성',layout:'divider-content',options:[['content-led','콘텐츠 중심형'],['song-led-split','교가 우선형'],['editorial-cards','에디토리얼형'],['heritage-document','기록 문서형'],['open-gallery','여백 갤러리형']]},
  month:{label:'월력 앞면',objects:'월 제목 · 요일 · 날짜 격자 · 일정 · 미니 월력',use:'가독성이 가장 중요한 월별 핵심 면',caution:'월력과 날짜를 이미지에 생성하지 않음',layout:'month-calendar',options:[['calendar-led','달력 중심형'],['large-month-number','대형 월 숫자형'],['top-image-band','상단 이미지 띠형'],['split-calendar-image','이미지·달력 분할형'],['open-editorial','여백 중심 에디토리얼형']]},
  'month-back':{label:'월력 뒷면',objects:'사용자 사진 프레임 · 학교 이미지 · AI 배경 · 월력 · 플래너 · 메모',use:'사진 교체형과 완성 일러스트형을 분명히 나누어 구성',caution:'사용자 사진은 샘플이 든 교체 가능 프레임이며 AI 배경과 별도 개체로 유지',layout:'back-split',options:[['image-calendar','사진+월력형'],['large-image','대형 사진형'],['photo-collage','사진 콜라주형'],['planner','플래너 중심형'],['memo-calendar','메모+미니 월력형'],['illustration-led','일러스트 중심형']]},
  'back-cover':{label:'뒷표지',objects:'학교명 · 교표 · 주소·연락처 · 마감 이미지',use:'표지의 조형 언어를 이어 세트를 마감',caution:'학교 정보 영역의 가독성을 유지',layout:'closing-split',options:[['school-info','학교 정보형'],['cover-continuation','표지 연결형'],['photo-closing','마감 사진형'],['minimal-brand','미니멀 브랜드형']]}
 };
 const catalog=Object.freeze({id:'school-calendar-design-types',version:'0.3.0',schemaVersion:'design-type-catalog.v2',scope:'desk-first',principle:'designer-finished-editable-start',commonGuideline,styles,expressionOptions:Object.freeze({monthFrontMode:[['color-only','색상만 변화'],['color-accent','색상 + 작은 장식'],['small-illustration','빈칸 작은 일러스트'],['alternating-accent','좌우 포인트 교대'],['quarterly-theme','분기별 테마']],monthBackMode:[['auto-match','구성에 맞게 자동 추천'],['photo-minimal','사진 중심 미니멀'],['photo-editorial','사진 중심 에디토리얼'],['functional-calm','기능 개체 중심'],['illustration-series','월별 일러스트 시리즈']]}),roles});
 root.ACDLDesignTypeCatalog=catalog;
})(typeof window==='undefined'?globalThis:window);
