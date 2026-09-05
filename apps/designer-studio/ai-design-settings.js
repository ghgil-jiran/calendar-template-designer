(function(root){
 const VERSION=Object.freeze({module:'1.1.0',promptSet:'school-calendar-prompt@0.1.0',styleProfile:'school-calendar-styles@0.1.0',pageRules:'calendar-page-rules@0.1.0',qualityProfile:'print-safe-quality@0.1.0'});
 const ROLE_LABELS=Object.freeze({cover:'표지',annual:'연력','school-symbols':'학교 상징·간지',month:'월력','month-back':'월력 뒷면','back-cover':'뒷표지'});
 function projectPages(project){return project?.book?.pageInstances||project?.book?.pages||[]}
 function pageRoles(project){const roles=[];projectPages(project).forEach(page=>{const role=page.semanticPageRole||page.role||page.pageRole;if(role&&!roles.includes(role))roles.push(role)});return roles}
 function summary(project){const size=project?.productType?.pageSize||{},settings=project?.settings||{};return {productType:project?.productType?.category||'미설정',pageSize:size.width&&size.height?`${size.width} × ${size.height} ${size.unit||'mm'}`:'미설정',academicYear:settings.year||'미설정',startMonth:settings.startMonth||'미설정',pageCount:projectPages(project).length,roles:pageRoles(project).map(role=>ROLE_LABELS[role]||role),versions:{...VERSION}}}
 const VARIANT_BLUEPRINTS=Object.freeze([
  {key:'balanced',name:'단정한 균형형',description:'학교 정보와 달력 가독성을 우선하고 장식을 여백 안에 절제해 배치합니다.',palette:['#315e9e','#dbe8f8','#f7f9fc'],motif:'corner',assets:['부분 배경','모서리 일러스트','사진 프레임'],styles:['차분한 제목 위계','선명한 달력 대비'],layout:'정보 영역을 고정하고 남은 공간에 장식을 배치'},
  {key:'seasonal',name:'사계절 연결형',description:'같은 조형 언어를 유지하면서 월별 색과 독립 일러스트에 계절 변화를 줍니다.',palette:['#477b62','#e7f1eb','#f7efe2'],motif:'season',assets:['계절 일러스트','반복 패턴','월 표시 장식'],styles:['월별 계절 색상','공통 서체 위계'],layout:'표지에서 시작한 장식 흐름을 월별 페이지로 연결'},
  {key:'photo',name:'사진 중심 브랜드형',description:'학교 사진을 중심에 두고 교표와 정보 개체를 보호하는 프레임과 배지를 사용합니다.',palette:['#8a5b3d','#eadfd5','#f8f4ef'],motif:'photo',assets:['사진 프레임','브랜드 배지','얇은 배경 패턴'],styles:['학교 색상 중심','간결한 선과 여백'],layout:'사진 비중을 높이고 필수 정보는 독립 영역에 정렬'},
  {key:'playful',name:'학생 친화 포인트형',description:'읽기 쉬운 구조는 유지하면서 작은 캐릭터와 라벨을 포인트로 제한해 사용합니다.',palette:['#d66b55','#fde7a9','#e5f2ed'],motif:'badge',assets:['포인트 캐릭터','리본·라벨','날짜 주변 장식'],styles:['밝은 보조색','둥근 프레임'],layout:'달력 격자를 침범하지 않는 바깥 여백에 포인트 배치'}
 ]);
 const PAGE_PLAN_BLUEPRINTS=Object.freeze([
  {role:'cover',label:'표지',assetSlots:['전체·부분 배경','독립 일러스트','사진 프레임'],editableObjects:['연도','학교명','교표'],layout:'사진·제목·학교 정보의 표지 위계'},
  {role:'annual',label:'연력',assetSlots:['연력 프레임','코너 장식','옅은 패턴'],editableObjects:['연도','12개월 월력','공휴일'],layout:'연간 정보가 먼저 읽히는 넓은 격자'},
  {role:'month',label:'월력',assetSlots:['월 표시 장식','계절 일러스트','격자 주변 패턴'],editableObjects:['월·요일·날짜','학사일정','교훈·교표'],layout:'달력 격자를 보호한 상단·외곽 장식'},
  {role:'month-back',label:'월력 뒷면',assetSlots:['사진 프레임','미니월력 프레임','메모 장식'],editableObjects:['미니월력','띠 월력','플래너·체크리스트'],layout:'이미지와 보조 일정 영역의 균형'},
  {role:'back-cover',label:'뒷표지',assetSlots:['정보 프레임','브랜드 패턴','마감 장식'],editableObjects:['학교명','주소','연락처','교표'],layout:'표지와 연결되는 마감 및 학교 정보'}
 ]);
 function pagePlans(){return PAGE_PLAN_BLUEPRINTS.map(item=>({...item,revision:0,status:'mock-ready'}))}
 function createSession(input={}){const count=Math.max(2,Math.min(4,Number(input.variantCount)||3));return {schemaVersion:'ai-design-session.v0',status:'mock-review',scope:input.scope||'template',conditions:{style:input.style||'balanced',schoolLevel:input.schoolLevel||'all',decorationDensity:input.decorationDensity||'medium',photoMode:input.photoMode||'mixed',seasonalVariation:input.seasonalVariation||'medium',instruction:input.instruction||''},versions:{...VERSION},variants:VARIANT_BLUEPRINTS.slice(0,count).map((item,index)=>({...item,id:`mock-${index+1}-${item.key}`,selected:false,pagePlans:pagePlans(),qualityChecks:{readability:'pass',safeArea:'pass',printRisk:'review'}})),selectedVariantId:null};}
 function selectVariant(session,variantId){return {...session,selectedVariantId:variantId,variants:session.variants.map(item=>({...item,selected:item.id===variantId}))}}
 function regeneratePage(session,variantId,role){return {...session,variants:session.variants.map(variant=>variant.id!==variantId?variant:{...variant,pagePlans:variant.pagePlans.map(plan=>plan.role!==role?plan:{...plan,revision:plan.revision+1,status:'mock-regenerated'})})}}
 function canEnterEditor(session){return !!session?.selectedVariantId&&session.variants?.some(item=>item.id===session.selectedVariantId)}
 function createDraft(session,createdAt=new Date().toISOString()){if(!canEnterEditor(session))throw new Error('AI design proposal selection is required');const selected=session.variants.find(item=>item.id===session.selectedVariantId);return {schemaVersion:'ai-design-draft.v0',status:'selected-not-applied',createdAt,session:JSON.parse(JSON.stringify(session)),selectedVariant:JSON.parse(JSON.stringify(selected))}}
 root.ACDLAIDesignSettings=Object.freeze({VERSION,ROLE_LABELS,VARIANT_BLUEPRINTS,PAGE_PLAN_BLUEPRINTS,pageRoles,summary,createSession,selectVariant,regeneratePage,canEnterEditor,createDraft});
})(typeof window==='undefined'?globalThis:window);
