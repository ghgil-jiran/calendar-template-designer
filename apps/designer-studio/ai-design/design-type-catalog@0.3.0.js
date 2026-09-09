(function(root){
 const commonGuideline={
  title:'탁상달력 공통 AI 이미지 생성 및 디자인 지침',
  text:'AI 출력 캔버스는 도련까지 채우되 그림이 화면 전체를 채울 필요는 없습니다. 넓은 여백, 부분 색면, 대각선 면, 한쪽 띠, 작은 크롭 포인트를 적극 허용합니다. 학교 전경 사진, 학사 일정, 교가, 연혁 등 실제 학교 콘텐츠가 중심이며 AI는 현대적인 배경·색면·질감·일러스트만 생성합니다. 월력 앞면은 달력 가독성을 최우선으로 하고 색상이나 작은 장식만 절제해 변화시킵니다. 월력 뒷면은 선택한 구성과 사진 사용 방식에 맞춰 별도로 설계합니다. 실제 개체 보호 좌표가 항상 우선하며 날짜, 격자, 헤더, 플래너, 사진 프레임, 학교 정보, 로고, 교훈과 읽을 수 있는 문자·숫자는 생성하지 않습니다. 간지는 같은 스타일을 유지하면서 실제 순번·앞뒤·용도마다 서로 다른 이미지로 생성합니다.',
  lockedRules:['finished-size-260x180mm','production-size-266x186mm','bleed-3mm','editable-content-not-rasterized','binding-safe-area','actual-page-structure-first']
 };
 const pageGuidance=(cover,annual,divider,month,monthBack,backCover)=>({cover,annual,divider,month,'month-back':monthBack,'back-cover':backCover});
 const styles=[
  {id:'warm-neutral-mocha',name:'웜 뉴트럴 & 모카',description:'모카·샌드 베이지의 따뜻하고 현대적인 에디토리얼 스타일',colors:['#f4eee7','#a88772','#cbb9aa','#4c4743'],guidance:pageGuidance(
   ['모카와 샌드 베이지의 비대칭 대형 색면, 린넨 입자는 깊이만 보조','warm mocha and sand editorial composition, broad asymmetric tonal fields, subtle linen grain, no complete border'],
   ['오프화이트 바탕을 가로지르는 아주 옅은 모카 색면과 방향성','off-white surface, pale mocha tonal flow behind the annual overview, no grid or header bar'],
   ['모카·웜 토프·무드 베이지를 순번별로 변주한 독립적 빛과 패브릭 구도','unique divider composition in mocha, warm taupe or mood beige, soft studio light, purpose-led crop'],
   ['차분한 오프화이트 위에 월마다 위치가 달라지는 모카 색면과 미세한 선 리듬','calm off-white ground, month-specific mocha field and non-functional fine-line rhythm, no calendar grid'],
   ['같은 소재와 조명으로 이어지는 에디토리얼 정물 또는 추상 장면','cohesive mocha editorial still-life or abstract scene around protected components, no frames or cards'],
   ['표지의 모카 색면을 축소·반전한 조용한 마감 구도','quiet closing composition transforming the cover mocha fields, calm school-information zones'])},
  {id:'soft-pastel-watercolor',name:'소프트 파스텔 수채화',description:'맑은 파스텔 안료와 현대적인 여백을 조합한 수채화 스타일',colors:['#fbf7f4','#e7cbd2','#c9dfda','#c9d9ec'],guidance:pageGuidance(
   ['연분홍·민트·세룰리안의 넓고 투명한 흐름과 큰 크롭','cold-press watercolor paper, broad transparent pastel wash path, modern asymmetric crop, calm title zones'],
   ['흰 화지 위에 연력 뒤로 이어지는 아주 옅은 수평 안료 흐름','clean white watercolor paper, very pale horizontal pigment flow, calm annual field'],
   ['봄·여름·가을·겨울 색조와 용도에 따라 달라지는 독립적 수채화 장면','unique purpose-led divider scene, pastel watercolor gradient and gesture varied by season, not botanical by default'],
   ['월마다 다른 날씨·학교생활 소재를 담은 절제된 붓질과 넓은 여백','bright white paper, restrained month-specific watercolor gesture or school-life motif, no calendar grid'],
   ['동일한 화법으로 이어지는 월별 학교생활·날씨 장면과 파스텔 흐름','cohesive watercolor school-life or weather scene around protected components, no visible boxes'],
   ['가장자리에 절제된 수채화 번짐으로 표지와 연결','subtle watercolor edge accent, clean center and lower information field'])},
  {id:'clear-ui-line',name:'클리어 UI & 캐주얼 라인',description:'앱의 정돈감을 차용한 가벼운 선과 모듈형 공간 구성',colors:['#f4f5f5','#33465b','#aeb9c4','#d9dde2'],guidance:pageGuidance(
   ['무광 라이트 그레이와 비대칭 대형 선·원·모듈 리듬','matte light grey, modern asymmetric line system and cropped geometric rhythm, no faux UI'],
   ['연력의 읽기 흐름을 보조하는 옅은 방향선과 모듈 간격','subtle directional line rhythm supporting the overview, no grid, cards, or interface controls'],
   ['네이비·그레이 인덱스 축의 위치·방향·크기를 간지별로 다르게 구성','unique divider composition using a muted navy or grey index axis, varied position and scale, no text'],
   ['측면 인덱스 리듬과 투명한 대형 아웃라인 형태, 숫자는 생성하지 않음','matte off-white, side-index rhythm and large abstract outline form, no numbers, UI, or calendar grid'],
   ['편집 개체 사이를 연결하는 캐주얼 선과 낮은 대비의 모듈형 색면','casual line network and muted modular color fields around protected components, no panels or cards'],
   ['라이트 그레이 바탕과 절제된 하단 마감선','minimal light grey background, subtle closing divider, clear school-information area'])},
  {id:'trendy-mesh-aura',name:'트렌디 매시 & 오라',description:'저채도 파스텔 오로라와 부드러운 디지털 깊이의 유스 스타일',colors:['#fbf7e8','#f1d5c5','#d9d4ea','#cfe0e5'],guidance:pageGuidance(
   ['버터 옐로우·소프트 라벤더·파스텔 오렌지의 전면 오라 흐름','edge-to-edge low-chroma mesh aura, butter yellow, soft lavender and pastel orange, calm focal zones'],
   ['오프화이트 바탕을 가로지르는 매우 옅은 파스텔 스펙트럼','off-white ground with a very pale horizontal aura flow, calm annual field, no header strip'],
   ['간지 목적과 순번마다 다른 오라의 중심·방향·색 조합','unique full-surface divider aura with varied light center, direction and palette, no translucent card'],
   ['순백색 바탕과 월마다 다른 위치의 얇고 부드러운 그라디언트 흐름','pure white ground with a month-specific soft gradient flow, no calendar framework'],
   ['오라의 빛 흐름이 개체 사이를 연결하되 카드나 프레임은 만들지 않음','cohesive aura scene flowing around protected components, no frosted card, glass UI, or frames'],
   ['표지와 연결되는 파스텔 메시와 안정적인 하단 단색 영역','soft mesh gradient, muted lower finish, clear information field'])},
  {id:'traditional-hanji-tone',name:'단정 한지 & 닥종이',description:'닥종이 섬유와 절제된 먹선·전통 리듬의 현대적 재해석',colors:['#f0e6d2','#69735f','#a56e5d','#c8b590'],guidance:pageGuidance(
   ['연베이지 닥종이와 현대적으로 크롭한 창살·조각보 선 리듬','Korean Hanji fibers, contemporary cropped lattice or jogakbo line rhythm, restrained muted palette, no ornate border'],
   ['연베이지 한지 위에 넓고 옅은 먹 안개와 방향성 있는 선','pale Hanji, broad faint ink mist and directional line cadence, calm annual field'],
   ['용도별로 수묵 안개·산세·바람·창살·조각보를 다르게 해석','unique purpose-led Korean ink, mist, mountain, wind, lattice or jogakbo divider composition'],
   ['따뜻한 한지 바탕과 월별로 다른 먹선·비단색 리듬','warm Hanji with restrained month-specific ink or silk-color rhythm, no calendar grid'],
   ['동일한 현대 수묵 화법의 학교생활 또는 자연 장면을 개체 주변에 구성','cohesive contemporary Korean ink scene around protected components, subtle jogakbo planes, no frames'],
   ['한지 바탕과 하단의 아주 얇은 쑥색·다홍색 띠','Hanji paper, very thin muted traditional ribbon at bottom, clean closing field'])},
  {id:'modern-sage-eco',name:'모던 세이지 & 에코',description:'세이지 그린과 크림 아이보리의 산뜻한 북유럽 에코 스타일',colors:['#f3efe6','#9eab96','#526b5d','#c9c0aa'],guidance:pageGuidance(
   ['크림 재생지와 세이지의 비대칭 색면, 추상 자연선이 만드는 현대적 표지','cream recycled paper, broad asymmetric sage field, abstract nature line, Scandinavian editorial minimalism'],
   ['밝은 아이보리 위에 옅은 세이지 흐름과 자연스러운 공간 리듬','bright ivory, pale sage spatial flow and quiet natural rhythm, calm annual field'],
   ['식물 선화에 한정하지 않고 성장·연결·배움·환경을 간지별 추상화','unique divider illustration of growth, connection, learning or environment in muted sage, not leaf corners'],
   ['아이보리와 세이지의 낮은 대비 색면, 학교생활·날씨 모티프를 월별 변주','ivory and sage low-contrast field with month-specific school-life or weather motif, no calendar grid'],
   ['세이지·샌드·우드 계열로 통일한 친환경 학교생활 일러스트 장면','cohesive Scandinavian eco school-life illustration around protected components, no photo frames'],
   ['샌드 베이지 바탕과 하단의 얇은 포레스트 그린 선','sand recycled paper, thin forest-green closing line, clear school-information field'])},
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
