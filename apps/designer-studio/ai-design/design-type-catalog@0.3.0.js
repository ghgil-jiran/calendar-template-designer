(function(root){
 const commonGuideline={
  title:'탁상달력 공통 AI 이미지 생성 및 디자인 지침',
  text:'학교 전경 사진, 학사 일정, 교가, 연혁 등 실제 학교 콘텐츠가 중심입니다. AI는 266×186mm 제작 크기(260×180mm 재단, 사방 3mm 도련)에 맞는 배경·질감·가장자리 장식만 생성합니다. 정보 페이지는 고명도·저채도·낮은 대비를 유지하고 중앙 콘텐츠 영역을 비웁니다. 날짜, 월력, 학사일정, 학교 정보, 로고, 교훈과 읽을 수 있는 문자·숫자는 생성하지 않습니다. 표지와 뒷표지는 선택 스타일에 따라 더 강한 색을 사용할 수 있지만 편집 개체의 가독성과 제본 안전 영역을 지켜야 합니다.',
  lockedRules:['finished-size-260x180mm','production-size-266x186mm','bleed-3mm','editable-content-not-rasterized','binding-safe-area','actual-page-structure-first']
 };
 const pageGuidance=(cover,annual,divider,month,monthBack,backCover)=>({cover,annual,divider,month,'month-back':monthBack,'back-cover':backCover});
 const styles=[
  {id:'classic-texture',name:'클래식 텍스처',description:'고급 종이 질감과 미세한 테두리',colors:['#f4efe5','#173b63','#b49a67'],guidance:pageGuidance(
   ['엠보싱 아이보리 종이와 가장자리의 얇은 네이비·금빛 선','fine textured ivory paper, subtle felt grain, restrained double edge line, empty content field'],
   ['무광 베이지 그레이 종이와 상단의 은은한 음각선','matte beige grey paper, subtle debossed top accent, clear annual-calendar field'],
   ['차분한 아이보리 종이와 가장자리의 미세한 프레임 장식','warm ivory paper, faint edge accent, unique divider variation, empty content field'],
   ['눈이 편안한 오프화이트 종이와 매우 절제된 가장자리 포인트','matte off-white paper, sparse charcoal edge accent, unobstructed calendar field'],
   ['샌드 베이지 종이 질감과 사진 영역을 방해하지 않는 가장자리 음영','warm sand paper texture, subtle gallery mood, empty photo and planner regions'],
   ['표지와 같은 엠보싱 질감, 하단 학교 정보 영역은 비움','textured ivory paper, restrained closing edge line, clear lower information field'])},
  {id:'watercolor-soft',name:'수채화 & 소프트 드로잉',description:'투명한 수채화 번짐과 식물 실루엣',colors:['#f7edf0','#cfe5dc','#b8cceb'],guidance:pageGuidance(
   ['수채화 화지의 모서리에만 연분홍·민트 번짐','watercolor paper, transparent pastel wash at corners and edges, empty center'],
   ['흰 화지와 하단 가장자리의 옅은 파스텔 띠','clean white watercolor paper, faint pastel wash on bottom edge, open annual field'],
   ['상단 또는 모서리의 서로 다른 수채화 터치와 식물 실루엣','delicate botanical watercolor edge motif, low opacity, unique divider brush variation'],
   ['순백 화지와 월 제목 영역 바깥의 얇은 계절 붓 터치','bright white paper, single seasonal watercolor edge stroke, clear calendar field'],
   ['엷은 파스텔 번짐, 사진·플래너 영역은 단색으로 비움','soft full-page watercolor atmosphere, plain protected content regions, no visible boxes'],
   ['가장자리에 절제된 수채화 번짐으로 표지와 연결','subtle watercolor edge accent, clean center and lower information field'])},
  {id:'modern-geometry',name:'모던 그래픽 & 셰이프',description:'라이트 그레이와 낮은 대비의 기하학 선',colors:['#eef1f4','#536579','#aab8c7'],guidance:pageGuidance(
   ['라이트 그레이 바탕과 가장자리의 반투명 원·선','light grey background, low-opacity geometric edge shapes, spacious center'],
   ['미세한 대각선 패턴을 외곽에만 적용','subtle diagonal line pattern at outer edges, clean annual content field'],
   ['얇은 네이비·그레이 인덱스 바를 위치만 달리해 적용','thin muted index bar at page edge, unique position for each divider, open center'],
   ['무광 라이트 그레이와 구석의 작은 기하학 포인트','matte light grey, sparse geometric corner accent, unobstructed calendar field'],
   ['낮은 대비의 투톤 배경, 편집 개체 영역은 명확히 비움','soft muted two-tone background, plain protected photo and planner regions'],
   ['라이트 그레이 바탕과 절제된 하단 마감선','minimal light grey background, subtle closing divider, clear school-information area'])},
  {id:'seasonal-gradient',name:'사계절 그라디언트',description:'계절색이 부드럽게 이어지는 파스텔 메시',colors:['#f3d8d2','#d9e8cf','#d6e0f3'],guidance:pageGuidance(
   ['사계절색이 매우 부드럽게 섞인 파스텔 오로라','soft pastel mesh gradient, seasonal spectrum, calm center, low contrast'],
   ['오프화이트 바탕과 얇은 수평 2톤 그라디언트','off-white paper, faint horizontal two-tone gradient at edge, annual field clear'],
   ['간지마다 다른 계절 조합의 얇은 그라디언트 띠','thin seasonal gradient strip, unique palette for each divider, high-legibility center'],
   ['미색 바탕과 상단 외곽의 얇은 월별 그라디언트','warm white background, thin seasonal gradient edge accent, clear calendar field'],
   ['부드러운 계절 그라디언트, 모든 편집 개체 영역은 평온하게 유지','soft seasonal gradient atmosphere, plain protected regions, no glass UI panels'],
   ['표지와 연결되는 파스텔 메시와 안정적인 하단 단색 영역','soft mesh gradient, muted lower finish, clear information field'])},
  {id:'traditional-korean',name:'전통 단청 & 문양',description:'한지 질감과 절제된 한국 전통 문양',colors:['#efe4cf','#66745a','#a96655'],guidance:pageGuidance(
   ['한지 섬유 질감과 네 모서리의 톤다운 전통 문양','Korean Hanji paper texture, muted traditional corner motif, empty center'],
   ['연베이지 한지와 외곽의 아주 옅은 먹선','beige Hanji paper, faint outer ink line, clear annual field'],
   ['간지마다 다른 수묵 안개·창살·조각보 선 모티프','subtle Korean ink wash or lattice edge motif, unique divider variation, warm Hanji'],
   ['따뜻한 한지 바탕과 상단 가장자리의 단순 전통 띠','warm beige Hanji, minimal traditional edge pattern, unobstructed calendar field'],
   ['은은한 조각보 톤앤톤 면감, 편집 영역은 비움','muted Korean Jogakbo tone-on-tone texture, plain protected content regions'],
   ['한지 바탕과 하단의 아주 얇은 쑥색·다홍색 띠','Hanji paper, very thin muted traditional ribbon at bottom, clean closing field'])},
  {id:'academic-nordic',name:'아카데믹 노르딕',description:'샌드 베이지와 세이지 그린의 차분한 조합',colors:['#ded3bd','#93a28c','#315b4a'],guidance:pageGuidance(
   ['재생지 질감과 하단의 포레스트 그린 선','recycled sand paper texture, thin forest-green bottom accent, Nordic minimalism'],
   ['매트한 세이지 바탕과 넓은 정보 여백','matte pale sage background, calm Nordic educational mood, open annual field'],
   ['샌드 베이지와 세이지 계열의 위치가 다른 미니멀 바','sand paper, muted Nordic edge bar, unique color and position per divider'],
   ['부드러운 린넨 미색과 따뜻한 우드 브라운 포인트','soft ivory linen texture, sparse warm wood accent, clear calendar field'],
   ['샌드 베이지·세이지의 부드러운 수평 톤 변화','soft sand and sage tonal background, plain photo and planner regions'],
   ['샌드 베이지 바탕과 하단의 얇은 포레스트 그린 선','sand recycled paper, thin forest-green closing line, clear school-information field'])},
  {id:'classic-archive',name:'클래식 아카이브',description:'양장본과 기록물에서 가져온 절제된 깊이감',colors:['#6b2638','#d8c7a5','#39404a'],guidance:pageGuidance(
   ['버건디 양장 질감을 사용하되 텍스트 영역은 평온하게 비움','deep muted burgundy book-cloth texture, subtle debossed edge detail, clear central title field'],
   ['따뜻한 미색 기록지와 옅은 아카이브 테두리','warm archival paper, faint catalog edge marks without text, open annual field'],
   ['간지마다 위치가 다른 무문자 스탬프 형태와 기록지 질감','archival paper texture, abstract text-free stamp edge motif, unique divider variation'],
   ['밝은 기록지 바탕과 구석의 작은 무문자 도장 형태','light archival paper, tiny abstract text-free corner stamp, clear calendar field'],
   ['바랜 기록지 질감과 사진 영역 바깥의 얇은 아카이브 포인트','soft archival paper, restrained edge marks, plain photo and planner regions'],
   ['표지의 버건디를 낮은 강도로 반복한 기록물 마감','muted archival closing surface, restrained burgundy edge accent, clear information field'])}
 ];
 const roles={
  cover:{label:'표지',objects:'연도 · 학교 사진 · 교표 · 학교명·주소',use:'첫 인상과 학교 정체성을 보여주는 면',caution:'학교 콘텐츠와 문자는 별도 편집 개체로 유지',layout:'split-cover',options:[['large-photo','대형 학교 사진형'],['photo-collage','사진 콜라주형'],['typography','타이포그래피 중심형'],['illustration','일러스트 중심형'],['split','사진·정보 분할형']]},
  annual:{label:'표지 뒷면·연력',objects:'연도 · 12개월 월력 · 월 이름 · 주말 색상',use:'학사연도 전체 흐름을 확인하는 정보 면',caution:'12개월 정보 영역을 이미지에 그리지 않음',layout:'annual-grid',options:[['balanced-4x3','4×3 균형형'],['open-grid','넓은 여백 격자형'],['header-band','상단 연도 띠형'],['split-info','월력·정보 분할형']]},
  divider:{label:'간지',objects:'학교 상징 · 교가 · 연혁 · 안내 · 선택 콘텐츠',use:'실제 템플릿에 추가된 모든 간지에 공통 스타일을 적용',caution:'간지 수를 고정하지 않고 위치·순번·앞뒤·용도에 따라 각각 생성',layout:'divider-content',options:[['content-led','콘텐츠 중심형'],['song-led-split','교가 우선형'],['editorial-cards','에디토리얼형'],['heritage-document','기록 문서형'],['open-gallery','여백 갤러리형']]},
  month:{label:'월력 앞면',objects:'월 제목 · 요일 · 날짜 격자 · 일정 · 미니 월력',use:'가독성이 가장 중요한 월별 핵심 면',caution:'월력과 날짜를 이미지에 생성하지 않음',layout:'month-calendar',options:[['calendar-led','달력 중심형'],['large-month-number','대형 월 숫자형'],['top-image-band','상단 이미지 띠형'],['split-calendar-image','이미지·달력 분할형'],['open-editorial','여백 중심 에디토리얼형']]},
  'month-back':{label:'월력 뒷면',objects:'이미지 · 뒷면 월력 · 미니 월력 · 플래너 · 메모',use:'사진과 기록 기능을 월별 변화 규칙으로 조합',caution:'모든 기능 요소는 별도 편집 개체로 유지',layout:'back-split',options:[['image-calendar','이미지+월력형'],['large-image','대형 이미지형'],['photo-collage','사진 콜라주형'],['planner','플래너 중심형'],['memo-calendar','메모+미니 월력형']]},
  'back-cover':{label:'뒷표지',objects:'학교명 · 교표 · 주소·연락처 · 마감 이미지',use:'표지의 조형 언어를 이어 세트를 마감',caution:'학교 정보 영역의 가독성을 유지',layout:'closing-split',options:[['school-info','학교 정보형'],['cover-continuation','표지 연결형'],['photo-closing','마감 사진형'],['minimal-brand','미니멀 브랜드형']]}
 };
 const catalog=Object.freeze({id:'school-calendar-design-types',version:'0.3.0',schemaVersion:'design-type-catalog.v2',scope:'desk-first',principle:'designer-finished-editable-start',commonGuideline,styles,expressionOptions:Object.freeze({variationRhythm:[['uniform','통일형'],['color','색상 변화형'],['composition','구도 변화형'],['motif','모티프 변화형'],['photo','사진 변화형'],['decoration','장식 변화형'],['seasonal','계절 혼합형'],['alternating','교대형'],['story','스토리형']],monthColorVariation:[['fixed','고정'],['monthly','월별 색상'],['quarterly','분기별 색상'],['palette-cycle','팔레트 순환']],monthCompositionVariation:[['fixed','고정'],['alternating','교대 구도'],['monthly','월별 구도'],['content-aware','콘텐츠 맞춤']],monthMotifVariation:[['none','사용 안 함'],['subtle','작은 모티프'],['monthly','월별 모티프'],['school-theme','학교 주제 모티프']],monthDecorationVariation:[['low','절제'],['balanced','균형'],['rich','풍부']],monthBackPhoto:[['use','사용'],['none','사용 안 함']],monthBackSeason:[['none','계절 장식 없음'],['subtle','은은한 계절 변화'],['seasonal','사계절 변화']]}),roles});
 root.ACDLDesignTypeCatalog=catalog;
})(typeof window==='undefined'?globalThis:window);
