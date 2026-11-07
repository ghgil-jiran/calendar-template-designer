(function(root){
 const commonGuideline={
  title:'탁상달력 공통 AI 이미지 생성 및 디자인 지침',
  text:'인쇄용 상업 달력에 적합한 현대적이고 정돈된 시각 체계를 만듭니다. 전체 세트는 하나의 색상·형태·선·여백 문법을 공유하되 각 면의 정보 위계가 먼저 읽혀야 합니다. 도련까지 자연스럽게 이어지는 밝고 안정적인 바탕을 사용하고, 장식은 실제 편집 개체보다 앞서지 않도록 절제합니다. 넓은 여백을 적극적으로 사용하며 한 페이지에는 가장 적합한 하나의 주된 조형 흐름만 적용합니다. 화면 시안이 아니라 실제 인쇄물에서 선명하고 세련되게 보이는 색상 대비와 밀도를 유지합니다.',
  forbidden:'빈티지 문구류, 상장, 기념 앨범, 낡은 종이, 과도한 종이 질감, 네 모서리 장식, 반복 테두리, 의미 없는 꽃·잎 장식, 세트 전체에 반복되는 대각선 구도, 카드형 UI와 웹 화면처럼 보이는 표현',
  lockedRules:['finished-size-260x180mm','production-size-266x186mm','bleed-3mm','editable-content-not-rasterized','binding-safe-area','actual-page-structure-first']
 };
 const pageGuidance=(cover,annual,divider,month,monthBack,backCover)=>({cover,annual,divider,month,'month-back':monthBack,'back-cover':backCover});
 const styles=[
  {id:'editorial-graphic',name:'에디토리얼 그래픽',description:'비대칭 컬럼·선·색면과 과감한 크롭으로 만드는 문화 포스터형 조형 시스템',colors:['#f7f5ef','#1f3557','#de5b4f','#e8b84a'],guidance:pageGuidance(
   ['타이포그래피와 학교 사진이 들어갈 자리를 전제로 한 비대칭 컬럼·선·색면','contemporary editorial graphic system, asymmetric columns, rules and cropped color fields, designed for later bold typography and school photography, no generated text'],
   ['12개월 정보 흐름을 보조하는 넓은 여백과 짧은 선·색면의 편집 리듬','large clean negative space with sparse editorial rules and color fields supporting the annual overview, no grid or header bar'],
   ['간지 목적마다 컬럼 폭·색면 크롭·선의 방향을 새롭게 조합한 문화 포스터형 구성','unique culture-poster-like divider using varied column proportions, cropped color fields and directional rules, no typography'],
   ['실제 월력 개체의 표현과 여백을 존중하는 밝은 바탕과 한 가지 작은 편집 포인트','bright continuous ground around the actual editable calendar treatment, with only one restrained editorial accent per month'],
   ['사진·플래너·일러스트 구성에 맞춰 컬럼·선·색면이 개체 사이를 연결하는 편집 구성','editorial columns, rules and color fields connecting the selected editable components without drawing frames or cards'],
   ['표지의 컬럼과 색면 비례를 변형해 학교 정보가 선명한 마감 구성','closing composition transforming the cover column and color-field proportions around calm school-information zones'])},
  {id:'campus-documentary',name:'캠퍼스 다큐멘터리',description:'실제 학교 사진을 주인공으로 두고 캡션 리듬·표식·색 보정 분위기만 더하는 사진 시스템',colors:['#f5f6f3','#244b62','#d6a34a','#bf584c'],guidance:pageGuidance(
   ['실제 학교 사진을 크게 보여줄 여백과 다큐멘터리 표식·짧은 선의 절제된 배경','documentary layout prepared for a real school photograph, flat vector color fields with a few simple dots or short rules, no invented photo, text, physical prop, texture, or registration mark'],
   ['연력 정보를 방해하지 않는 밝은 바탕과 작은 사진기록형 색상 표식','bright unobtrusive ground with a few small documentary color markers, no grid, photo, or caption text'],
   ['실제 학교 자료와 사진을 주인공으로 두는 기록물 편집 리듬, AI 사진 생성 금지','documentary divider atmosphere framing later real school assets through sparse marks and color rhythm, never generate a photograph'],
   ['실제 월력 개체 주변의 깨끗한 바탕에 월별 작은 기록 색상 또는 표식만 변화','clean ground around the actual editable calendar treatment, only one small month-specific documentary color marker'],
   ['사용자·학교 사진이 항상 주인공이고 AI는 색상 분위기와 그래픽 표식만 제공','real replaceable school photography remains dominant; AI provides only restrained color atmosphere, crop guidance and documentary graphic marks'],
   ['표지의 기록형 표식과 색상 체계를 축소해 학교 정보 중심으로 마감','quiet documentary closing field with sparse marks and clear school-information space, no invented photograph'])},
  {id:'modular-color-system',name:'모듈러 컬러 시스템',description:'월력 격자와 결합되는 색상 블록과 구조적 비례로 월별 차이를 만드는 시스템',colors:['#f6f7f3','#2458a6','#e55445','#e5b72f'],guidance:pageGuidance(
   ['단단한 비례의 모듈 색면과 넓은 밝은 공간이 만드는 현대적 브랜드 표지','modern brand composition using proportioned modular color fields and large bright space, no paper objects or faux UI'],
   ['연력 배열과 충돌하지 않는 저대비 모듈 간격과 작은 색상 블록','low-contrast modular spacing and sparse color blocks supporting the annual overview, no grid or panels'],
   ['목적별로 면적 비율·결합 방식·색상 순서를 달리한 독립적 모듈 구성','unique divider built from a different modular proportion, connection rule and color sequence, no text'],
   ['실제 월력 개체의 배경 표현을 침범하지 않는 단색 바탕과 한두 개의 구조적 색상 블록','solid light ground respecting the actual editable calendar surface with one or two structural color blocks only'],
   ['사진·플래너·메모 개체의 실제 비례와 정렬축을 이어주는 모듈형 색면','modular fields aligned to actual editable components without outlining, imitating, or enclosing them'],
   ['표지의 모듈 비례를 단순화한 강한 브랜드 마감과 정보 여백','simplified closing arrangement of the cover modular proportions with clear school-information space'])},
  {id:'contemporary-illustration',name:'컨템퍼러리 일러스트레이션',description:'학습·과학·음악·스포츠를 비인물 현대 조형으로 표현하는 고정 화법',colors:['#f7f4ea','#3678b8','#e96b55','#e6b94d'],guidance:pageGuidance(
   ['비인물 교육 모티프와 대담한 크롭, 일관된 평면 벡터 화법','contemporary flat editorial illustration with non-human educational motifs, bold crop and consistent shape language, no people or school buildings'],
   ['연력 바깥의 작은 추상 교육 모티프와 넓은 밝은 공간','large bright annual field with a few small abstract learning motifs in one fixed illustration language'],
   ['배움·연결·음악·과학·스포츠를 간지 목적에 맞게 해석한 비인물 조형','unique purpose-led non-human illustration of learning, connection, music, science or sport in the same strict flat style'],
   ['실제 월력 개체 밖의 빈칸에만 놓이는 하나의 작은 현대 일러스트','one small contemporary illustration only in genuine unused space, with the editable calendar remaining dominant'],
   ['월별 비인물 교육 조형을 같은 선·면·팔레트로 유지','cohesive monthly non-human educational illustration series using identical line weight, shape grammar and palette'],
   ['표지 장면의 형태와 색을 축약한 작은 마감 일러스트','small closing illustration resolving the cover shapes and colors around clear school information'])},
  {id:'digital-aura-motion',name:'디지털 오라 & 모션',description:'저채도 빛의 방향성과 운동감으로 청소년의 속도와 에너지를 표현하는 디지털 시스템',colors:['#f6f7fb','#596bd6','#78c9d2','#f0a36b'],guidance:pageGuidance(
   ['한 방향으로 흐르는 오라와 속도감 있는 빛의 궤적, 넓은 정지 공간','directional low-chroma aura and restrained motion trails balanced by large still space, no glass card or UI'],
   ['연간 흐름을 암시하는 아주 옅은 빛의 이동과 깨끗한 정보 공간','very pale directional light movement suggesting a year-long flow, clean annual field, no panel'],
   ['간지 목적마다 속도·궤적·빛의 중심을 다르게 설계한 독립적 오라','unique divider aura with purpose-specific velocity, trajectory and light center, no repeated diagonal template'],
   ['실제 월력 개체 주변의 거의 흰 바탕과 작은 빛의 방향 변화','near-white ground around the actual editable calendar treatment with one subtle monthly motion cue'],
   ['개체 사이의 이동 방향을 연결하는 저채도 오라와 부드러운 운동 궤적','low-chroma aura and soft motion trajectory connecting actual components, no white cards, UI or frames'],
   ['표지의 운동감을 감속시켜 하나의 조용한 빛으로 닫는 구성','closing aura that decelerates the cover motion into one quiet light field'])},
  {id:'korean-modern-graphic',name:'한국적 모던 그래픽',description:'조각보 면 분할·창살 비례·먹선 운동을 재료감 없이 현대적으로 추상화한 시스템',colors:['#f5f2ea','#24505b','#c8574e','#d6a33e'],guidance:pageGuidance(
   ['조각보 면 분할과 창살 비례, 한 번의 먹선 운동을 평면 그래픽으로 추상화','contemporary Korean graphic abstraction using jogakbo plane division, lattice proportion and one kinetic ink-like line, no paper texture'],
   ['연력 배열을 받치는 절제된 한국적 비례와 옅은 면 분할','restrained Korean proportional rhythm and pale plane division supporting the annual overview, no traditional object'],
   ['간지 목적마다 조각보 비례·창살 간격·먹선 운동의 조합을 다르게 구성','unique divider varying jogakbo proportion, lattice interval and kinetic ink-line movement, no heritage decoration'],
   ['실제 월력 개체의 표현을 존중하는 밝은 바탕과 한 가지 절제된 면 분할 또는 선 운동','bright ground respecting the actual editable calendar treatment with one restrained plane division or line movement'],
   ['편집 개체의 실제 축에 반응하는 현대적 조각보 면과 유연한 먹선 운동','modern jogakbo planes and kinetic ink-like lines responding to actual editable axes, no frames or traditional props'],
   ['표지의 한국적 비례와 선 운동을 압축한 단정한 마감','clean closing composition compressing the cover Korean proportions and line movement'])},
 ];
 const styleForbidden=Object.freeze({
  'editorial-graphic':'수채화 번짐, 손그림 장식, 입체 소품, 감성 문구류, 장식 테두리, 대칭 카드 배열',
  'campus-documentary':'가짜 사진, 생성된 학교 풍경, 필름 프레임 남용, 스크랩북, 빈티지 기록물, 사진을 대신하는 일러스트 장면',
  'modular-color-system':'수채화, 손그림, 자연 풍경, 식물 장식, 빛 번짐, 종이 질감, 유기적인 장식 테두리',
  'contemporary-illustration':'실사 장면, 3D 캐릭터, 유아용 캐릭터, 과도하게 귀여운 표정, 학교급을 특정하는 인물이나 교복',
  'digital-aura-motion':'유리 카드, 앱 UI, 사이버펑크 네온, 렌즈 플레어, 과도한 그라데이션, 읽기 영역을 가로지르는 빛줄기',
  'korean-modern-graphic':'한지 질감, 전통 문양 복제, 붓글씨, 민속 소품, 고전 장식 테두리, 궁궐·한옥·산수화 장면'
 });
 const layoutDirections=Object.freeze({
  'photo-low':'사진은 하단 중심, 연도와 학교명은 상단·중앙의 독립된 읽기 영역','photo-wide':'가로로 긴 사진은 중앙, 연도와 학교 정보는 사진 밖 상·하단','photo-feature':'사진은 넓은 주 시각 영역, 학교 정보는 겹치지 않는 한쪽 정보축','center-photo':'중앙 사진을 주 시각축으로 두고 나머지 개체는 위·아래에 분리','left-photo':'왼쪽 사진과 오른쪽 정보 영역을 명확히 분리','right-photo':'오른쪽 사진과 왼쪽 정보 영역을 명확히 분리','distributed-header':'월 제목과 학교 개체를 좌우 상단에 나누고 월력 본문은 넓게 유지','center-title-school-left':'월 제목은 상단 중앙, 교표·학교명은 왼쪽 정보축','center-title-block':'월 제목을 상단 중앙의 주 위계로 두고 선택 개체는 양옆에 분산','left-title-split':'월 제목은 왼쪽 상단, 선택 개체는 오른쪽 상단에 정리','open-grid':'12개월 정보가 하나의 열린 영역으로 읽히도록 월별 구분선을 만들지 않음','individual-month-boxes':'12개 월을 같은 비중의 독립 영역으로 읽히게 구성','vertical-three-month-groups':'세로 4개 그룹에 각 3개월을 넣는 읽기 순서를 유지','horizontal-four-month-groups':'가로 3개 그룹에 각 4개월을 넣는 읽기 순서를 유지','school-intro-center-image':'상단 제목 아래 중앙의 교체 사진을 가장 크게 두고 선택 상징은 보조 위치','school-intro-left-image':'왼쪽 교체 사진과 오른쪽 제목·선택 상징 영역을 분리','school-intro-background-image':'큰 교체 사진 영역과 상단 제목 영역의 경계를 침범하지 않음','yearly-open-grid':'12개월 계획 영역을 박스 없이 같은 간격으로 유지','yearly-month-cards':'12개월 계획 영역을 같은 비중의 독립 영역으로 유지','yearly-vertical-groups':'세로 4개 그룹에 각 3개월 계획 영역을 유지','yearly-horizontal-groups':'가로 3개 그룹에 각 4개월 계획 영역을 유지','schedule-open-grid':'12개월과 월별 일정이 열린 한 페이지 흐름으로 읽히게 유지','schedule-month-cards':'12개의 월·일정 묶음을 같은 비중으로 유지','schedule-vertical-groups':'세로 4개 그룹에 각 3개월의 일정 영역을 유지','schedule-horizontal-groups':'가로 3개 그룹에 각 4개월의 일정 영역을 유지','photo-calendar-split':'넓은 사진 영역과 좁은 월력·정보 영역을 분리','monthly-plan':'상단의 가로 사진 아래에 선택한 기능 개체를 나란히 배치','image-memo-column':'왼쪽의 넓은 사진과 오른쪽의 월력·메모 세로 열을 분리','collage-date-strip':'복수 사진은 상단·중앙에 두고 월력 띠력은 페이지 하단 전체 폭에 고정','centered-information':'연도가 있으면 연도를, 없으면 교표를 중앙 주 요소로 두고 나머지 학교 정보는 중앙 하단에 정리','lower-information':'연도가 있으면 연도를, 없으면 교표를 중앙 주 요소로 두고 나머지 학교 정보는 페이지 하단에 낮고 넓게 정리','left-information':'연도가 있으면 연도를, 없으면 교표를 왼쪽 주 요소로 두고 나머지 학교 정보는 오른쪽에 정리','centered-year':'연도를 주 위계로 두고 학교 정보 묶음을 그 아래에 정리','centered':'연도와 12개월 정보를 중앙축에 맞춤','logo-left':'교표는 상단 왼쪽, 연도와 12개월 정보는 중앙축 유지','logo-right':'교표는 상단 오른쪽, 연도와 12개월 정보는 중앙축 유지'
 });
 const stylePlacement=Object.freeze({
  'editorial-graphic':'비대칭 색면과 짧은 선은 실제 개체의 바깥 여백과 개체 사이 연결축에만 배치합니다.','campus-documentary':'실제 사진 개체가 있으면 사진이 주인공이 되며, AI는 사진 밖의 작은 표식과 짧은 선만 배치합니다.','modular-color-system':'색상 모듈은 실제 개체의 정렬축을 따르되 개체 영역을 카드나 박스로 둘러싸지 않습니다.','contemporary-illustration':'비인물 일러스트는 실제 개체가 차지하지 않는 가장 넓은 한 영역에만 배치합니다.','digital-aura-motion':'빛과 운동 흐름은 실제 개체 사이의 빈 공간을 연결하되 읽기 영역을 가로지르지 않습니다.','korean-modern-graphic':'조각보 면은 바깥 여백에, 먹선 운동은 개체 사이 빈 공간에 두고 읽기 영역 내부로 들어가지 않습니다.'
 });
 const roleForbidden=Object.freeze({
  cover:'연도·학교명 위계를 가리는 중심 모티프, 교표와 경쟁하는 문장형 표식, 실제 사진 영역을 대신하는 가짜 사진·그림',annual:'12개월 정보 영역 내부의 장식과 강한 색 대비, 월 구분으로 오인되는 가짜 격자·카드·헤더 띠','divider-academic-schedule':'월별 일정 영역 내부의 장식과 선, 일정표로 오인되는 가짜 격자, 월 그룹의 읽기 순서를 끊는 대형 모티프','divider-yearly-plan':'월별 계획 영역 내부의 장식과 선, 체크리스트·메모선처럼 보이는 가짜 기능 요소','divider-school-introduction':'실제 학교 사진을 대신하는 건물·교정 이미지, 제목과 사진 사이를 가르는 장식 프레임','divider-school-symbols':'교가·교훈의 긴 읽기 영역을 통과하는 장식, 교표처럼 보이는 가짜 상징','divider':'선택 개체의 읽기 영역을 통과하는 장식, 실제 구성과 무관한 대형 중심 모티프',month:'월력 본문과 일정 영역을 통과하는 장식, 달력 셀·요일 막대·월 제목처럼 보이는 가짜 기능 요소, 선택 사진 영역을 대신하는 이미지', 'month-back':'사진·월력·학사일정·플래너·메모 영역을 통과하는 장식, 선택하지 않은 가짜 사진 프레임과 기능 패널','back-cover':'학교명·주소·연락처의 읽기 영역을 통과하는 장식, 교표처럼 보이는 가짜 표식, 실제 학교 사진을 대신하는 이미지'
 });
 const objectNames=Object.freeze({year:'연도','year-calendar':'12개월 월력','annual-calendar':'12개월 월력','school-building':'교체 가능한 학교 사진','school-logo':'교표','school-name':'학교명','school-english-name':'영문 학교명','school-motto':'교훈','school-slogan':'슬로건','school-song':'교가',title:'제목',body:'본문','schedule-list':'월별 학사일정','yearly-plan':'12개월 Yearly Plan',image:'교체 사진','image-frame':'교체 사진','image-slot':'교체 사진','current-calendar':'해당 월 월력','back-calendar':'해당 월 월력','previous-mini-calendar':'전월 미니 월력','next-mini-calendar':'다음 달 미니 월력','academic-schedule':'해당 월 학사일정',planner:'월간 계획표',memo:'메모','month-date-strip':'월력 띠력',address:'주소',contact:'연락처',website:'웹사이트'});
 function actualPageGuidance(styleId,page={}){const style=styles.find(item=>item.id===styleId)||styles[0],role=page.role||'divider',purpose=page.typeId||page.compositionType||'',layout=page.layoutId||'',objects=Array.isArray(page.objects)?page.objects:[],roleBase=style.guidance?.[role]?.[0]||'',layoutText=layoutDirections[layout]||'페이지 설정의 실제 개체 위치와 읽기 순서를 그대로 유지',placement=stylePlacement[style.id]||'',objectText=objects.length?`선택된 ${objects.map(id=>objectNames[id]||id).join(' · ')} 개체는 각각 독립 편집 영역으로 남깁니다.`:'선택된 편집 개체가 없는 영역만 배경 디자인에 사용합니다.',forbiddenKey=role==='divider'?`divider-${purpose}`:role,forbidden=roleForbidden[forbiddenKey]||roleForbidden[role]||roleForbidden.divider,keywordBase=style.guidance?.[role]?.[1]||'',keywords=[keywordBase,layout&&`layout ${layout}`,purpose&&`page purpose ${purpose}`].filter(Boolean).join(', ');return {description:`${roleBase}. ${layoutText}. ${objectText} ${placement}`.replace(/\s+/g,' ').trim(),keywords,forbidden}}
 const roles={
  cover:{label:'표지',objects:'연도 · 학교 사진 · 교표 · 학교명·주소',use:'대표 사진의 위치를 기준으로 실제 표지 구도를 선택하는 면',caution:'학교 사진과 모든 문자는 별도 교체·편집 개체로 유지',layout:'cover-photo-position',options:[['center-photo','중앙 사진형'],['left-photo','왼쪽 사진형'],['right-photo','오른쪽 사진형'],['free','자유 구성형 · 대표 사진 없음 포함']]},
  annual:{label:'연력',objects:'연도 · 실제 학사연도 12개월 월력 · 선택 교표',use:'표지 안쪽면·간지·뒷표지 안쪽면에 배치할 수 있는 연간 정보 구성',caution:'연도와 12개월 월력은 필수 편집 개체이며 다음해 월에는 실제 연도를 표시하고 이미지에 굽지 않음',layout:'annual-grid',options:[['open-grid','무박스 그리드형'],['individual-month-boxes','월별 개별 박스형'],['vertical-three-month-groups','세로 3개월 그룹형'],['horizontal-four-month-groups','가로 4개월 그룹형']]},
  divider:{label:'간지',objects:'학교 상징 · 교가 · 연혁 · 안내 · 선택 콘텐츠',use:'실제 템플릿에 추가된 모든 간지에 공통 스타일을 적용',caution:'간지 수를 고정하지 않고 위치·순번·앞뒤·용도에 따라 각각 생성',layout:'divider-content',options:[['content-led','콘텐츠 중심형'],['song-led-split','교가 우선형'],['editorial-cards','에디토리얼형'],['heritage-document','기록 문서형'],['open-gallery','여백 갤러리형']]},
  month:{label:'월력 앞면',objects:'월 제목 · 요일 · 날짜 격자 · 일정 · 미니 월력',use:'가독성이 가장 중요한 월별 핵심 면',caution:'월력과 날짜를 이미지에 생성하지 않음',layout:'month-calendar',options:[['calendar-led','달력 중심형'],['large-month-number','대형 월 숫자형'],['top-image-band','상단 이미지 띠형'],['split-calendar-image','이미지·달력 분할형'],['open-editorial','여백 중심 에디토리얼형']]},
  'month-back':{label:'월력 뒷면',objects:'사용자 사진 프레임 · 학교 이미지 · AI 배경 · 월력 · 플래너 · 메모',use:'사진 교체형과 완성 일러스트형을 분명히 나누어 구성',caution:'사용자 사진은 샘플이 든 교체 가능 프레임이며 AI 배경과 별도 개체로 유지',layout:'back-split',options:[['image-calendar','사진+월력형'],['large-image','대형 사진형'],['photo-collage','사진 콜라주형'],['planner','플래너 중심형'],['memo-calendar','메모+미니 월력형'],['illustration-led','일러스트 중심형']]},
  'back-cover':{label:'뒷표지',objects:'연도 · 학교 전경 사진 · 교표 · 학교명 · 주소·연락처',use:'실제 학교 정보와 선택한 대표 개체를 중심으로 달력을 마감하는 면',caution:'학교 전경은 교체 가능한 편집 프레임으로 유지하고 모든 학교 정보의 가독성을 보호',layout:'back-cover-information',options:[['school-information','교표 + 학교 정보형'],['year-school-information','연도 + 교표 + 학교 정보형'],['school-photo-information','연도 + 학교 전경 + 교표 + 학교 정보형']]}
 };
 const catalog=Object.freeze({id:'school-calendar-design-types',version:'0.3.0',schemaVersion:'design-type-catalog.v2',scope:'desk-first',principle:'designer-finished-editable-start',commonGuideline,styles,styleForbidden,actualPageGuidance,expressionOptions:Object.freeze({monthFrontMode:[['color-only','색상만 변화'],['color-accent','색상 + 작은 장식'],['small-illustration','빈칸 작은 일러스트'],['alternating-accent','좌우 포인트 교대'],['quarterly-theme','분기별 테마']],monthBackMode:[['auto-match','구성에 맞게 자동 추천'],['photo-minimal','사진 중심 미니멀'],['photo-editorial','사진 중심 에디토리얼'],['functional-calm','기능 개체 중심'],['illustration-series','월별 일러스트 시리즈']]}),roles});
 root.ACDLDesignTypeCatalog=catalog;
})(typeof window==='undefined'?globalThis:window);
