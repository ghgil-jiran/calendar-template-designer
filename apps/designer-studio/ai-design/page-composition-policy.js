(function(root){
 const freeze=value=>Object.freeze(value);
 const rules=freeze({
  cover:freeze({
   'center-photo':{required:['year','school-building','school-name'],defaults:['school-logo','school-slogan'],layouts:['photo-low','photo-wide','photo-feature']},
   'left-photo':{required:['year','school-building','school-name'],defaults:['school-logo','school-slogan'],layouts:['photo-low','photo-wide','photo-feature']},
   'right-photo':{required:['year','school-building','school-name'],defaults:['school-logo','school-slogan'],layouts:['photo-low','photo-wide','photo-feature']},
   free:{required:['year','school-name'],defaults:[],layouts:['photo-low','photo-wide','photo-feature']}
  }),
  month:freeze({
   'calendar-led':{required:[],defaults:[],layouts:['distributed-header','center-title-school-left','center-title-block','left-title-split']},
   'large-month-number':{required:[],defaults:[],layouts:['distributed-header','center-title-school-left','center-title-block','left-title-split']},
   'top-image-band':{required:['image-frame'],defaults:[],layouts:['distributed-header','center-title-school-left','center-title-block','left-title-split']},
   'split-calendar-image':{required:['image-frame'],defaults:[],layouts:['distributed-header','center-title-school-left','center-title-block','left-title-split']},
   'open-editorial':{required:[],defaults:[],layouts:['distributed-header','center-title-school-left','center-title-block','left-title-split']}
  }),
  'month-back':freeze({
   'image-calendar':{required:['image','current-calendar'],defaults:[],layouts:['photo-calendar-split','image-memo-column','monthly-plan']},
   'large-image':{required:['image'],defaults:[],layouts:['photo-calendar-split','image-memo-column']},
   'photo-collage':{required:['image'],defaults:[],minimumImages:2,layouts:['collage-date-strip','image-memo-column']},
   planner:{required:['planner-daily'],defaults:[],layouts:['monthly-plan','image-memo-column']},
   'memo-calendar':{required:['current-calendar','memo'],defaults:[],layouts:['image-memo-column','monthly-plan']},
   'illustration-led':{required:['memo'],defaults:[],layouts:['image-memo-column','monthly-plan']}
  }),
  'back-cover':freeze({
   'school-information':{required:['school-logo','school-name'],defaults:['school-address','school-contacts'],layouts:['centered-information','lower-information','left-information']},
   'year-school-information':{required:['year','school-logo','school-name'],defaults:['school-address','school-contacts'],layouts:['centered-year','split-year-information','top-year-information']},
   'school-photo-information':{required:['year','school-building','school-logo','school-name'],defaults:['school-address','school-contacts'],layouts:['center-photo','left-photo','right-photo']}
  }),
  divider:freeze({
   'annual-calendar':{required:['annual-calendar'],defaults:[],layouts:['open-grid','individual-month-boxes','vertical-three-month-groups','horizontal-four-month-groups']},
   'school-symbols':{required:[],defaults:['title','school-logo','school-motto','school-song','school-tree','school-flower'],minimumContent:1,layouts:['individual-cards','split-panels','open-editorial','ruled-editorial']},
   'school-introduction':{required:['title','school-building'],defaults:[],layouts:['school-intro-center-image','school-intro-left-image','school-intro-background-image']},
   'academic-schedule':{required:['title','schedule-list'],defaults:[],layouts:['schedule-open-grid','schedule-month-cards','schedule-vertical-groups','schedule-horizontal-groups']},
   'yearly-plan':{required:['yearly-plan'],defaults:[],layouts:['yearly-open-grid','yearly-month-cards','yearly-vertical-groups','yearly-horizontal-groups']},
   free:{required:[],defaults:[],minimumContent:1,layouts:['content-led','editorial-cards','heritage-document','open-gallery']},
   blank:{required:[],defaults:[],layouts:[]}
  })
 });
 function rule(role,type){return rules[role]?.[type]||null}
 function initial(role,type){const found=rule(role,type);return found?[...new Set([...found.required,...found.defaults])]:[]}
 function validate(role,type,components,layoutId,{imageCount=1}={}){
  const found=rule(role,type);if(!found)return {valid:false,missing:[],reason:'unknown-type'};
  const selected=new Set(components||[]),missing=found.required.filter(id=>!selected.has(id));
  const contentCount=role==='divider'&&type==='school-symbols'?[...selected].filter(id=>id!=='title').length:selected.size;
  const reason=missing.length?'missing-required':found.minimumContent&&contentCount<found.minimumContent?'empty-content':found.minimumImages&&imageCount<found.minimumImages?'too-few-images':layoutId&&!found.layouts.includes(layoutId)?'unsupported-layout':null;
  return {valid:!reason,missing,reason};
 }
 function schoolSymbolBoxes(objects, size={width:260,height:180}){
  const selected=new Set(objects||[]),hasSong=selected.has('school-song');
  const width=Number(size?.width)||260,height=Number(size?.height)||180;
  const insetX=width<=260?7:6;
  const songWidth=hasSong?(width<=260?40:Math.max(36,Math.min(46,10400/width))):0;
  const leftWidth=hasSong?(width<=260?40:100-2*insetX-songWidth-5):84;
  const leftX=hasSong?insetX:8,leftY=20,leftHeight=70;
  const boxes=[];
  if(selected.has('title'))boxes.push({id:'title',x:8,y:6,width:84,height:9});
  if(selected.has('school-logo'))boxes.push({id:'school-logo',x:7,y:6,width:10,height:10});
  if(selected.has('school-motto'))boxes.push({id:'school-motto',x:leftX,y:leftY,width:leftWidth,height:hasSong?18:20});
  const symbols=['school-tree','school-flower'].filter(id=>selected.has(id));
  const startY=leftY+(selected.has('school-motto')?24:0),availableHeight=leftHeight-(selected.has('school-motto')?24:0),gap=2;
  const columns=Math.min(2,symbols.length),rows=Math.ceil(symbols.length/Math.max(1,columns));
  symbols.forEach((id,index)=>boxes.push({id,x:leftX+(index%columns)*(leftWidth+gap)/columns,y:startY+Math.floor(index/columns)*(availableHeight+gap)/rows,width:(leftWidth-gap*(columns-1))/Math.max(1,columns),height:(availableHeight-gap*(rows-1))/Math.max(1,rows)}));
  if(hasSong)boxes.push({id:'school-song',x:width<=260?53:100-insetX-songWidth,y:18,width:songWidth,height:74});
  return boxes;
 }
 function schoolIntroductionBoxes(objects,layoutId,size={width:260,height:180}){
  const selected=new Set(objects||[]),boxes=[];
  const add=(id,x,y,width,height)=>{if(selected.has(id))boxes.push({id,x,y,width,height})};
  const wide=(Number(size?.width)||260)/(Number(size?.height)||180)>1.7;
  if(layoutId==='school-intro-left-image'){
   add('title',7,6,86,9);
   add('school-building',7,20,wide?56:54,70);
   const extras=['school-logo','school-motto'].filter(id=>selected.has(id));
   extras.forEach((id,index)=>add(id,wide?68:66,20+index*28,wide?25:27,id==='school-logo'?20:24));
  }else if(layoutId==='school-intro-background-image'){
   add('school-building',5,5,90,88);
   add('title',10,9,80,10);
   const extras=['school-logo','school-motto'].filter(id=>selected.has(id));
   extras.forEach((id,index)=>add(id,72,24+index*25,18,id==='school-logo'?16:21));
  }else{
   add('title',7,6,86,9);
   add('school-building',wide?12:16,20,wide?76:68,65);
   const extras=['school-logo','school-motto'].filter(id=>selected.has(id));
   const width=extras.length>1?22:30,start=50-width*extras.length/2;
   extras.forEach((id,index)=>add(id,start+index*width,87,width-2,8));
  }
  return boxes;
 }
 function twelveMonthZones(purpose,{title=false}={}){
  if(purpose==='academic-schedule')return {title:{x:7,y:5,width:86,height:8},content:{x:5,y:15,width:90,height:80}};
  if(purpose==='yearly-plan')return {title:{x:7,y:4,width:86,height:7},content:{x:5,y:title?13:5,width:90,height:title?82:90}};
  return null;
 }
 function coverZones(typeId,layoutId){
  const profiles={
    'center-photo':{photoLow:{image:[25,36,50,38],year:[16,10,68,12],identity:[8,80,84,14]},photoWide:{image:[8,30,84,43],year:[16,10,68,12],identity:[8,80,84,14]},photoFeature:{image:[8,8,84,66],year:[16,77,68,10],identity:[8,87,84,8]}},
    'left-photo':{photoLow:{image:[5,12,58,76],year:[68,10,27,18],identity:[68,36,27,50]},photoWide:{image:[5,7,66,86],year:[75,8,20,18],identity:[75,34,20,56]},photoFeature:{image:[5,5,72,90],year:[80,8,16,18],identity:[80,34,16,56]}},
    'right-photo':{photoLow:{image:[53,28,42,62],year:[8,9,40,18],identity:[8,68,40,20]},photoWide:{image:[46,23,49,69],year:[8,8,34,18],identity:[8,67,34,22]},photoFeature:{image:[39,17,56,76],year:[7,8,28,18],identity:[7,65,28,25]}},
    free:{photoLow:{image:null,year:[29,18,42,22],identity:[8,78,84,15]},photoWide:{image:null,year:[8,16,42,22],identity:[8,76,84,16]},photoFeature:{image:null,year:[8,12,50,25],identity:[8,72,84,20]}}
   };
  const key=layoutId==='photo-wide'?'photoWide':layoutId==='photo-feature'?'photoFeature':'photoLow';
  return profiles[typeId]?.[key]||profiles['center-photo'].photoLow;
 }
 function monthHeaderZones(layoutId){const profiles={
  'distributed-header':{title:[36,10,28,9],calendar:[5,8,90,87],left:[5,11,27,9],right:[68,11,27,9]},
  'center-title-school-left':{title:[37,10,30,9],calendar:[5,8,90,87],left:[5,11,28,9],right:[70,11,25,9]},
  'center-title-block':{title:[38,9,24,11],calendar:[5,8,90,87],left:[5,11,27,8],right:[68,11,27,8]},
  'left-title-split':{title:[5,10,25,9],calendar:[5,8,90,87],left:[34,11,28,9],right:[68,11,27,9]}
 };return profiles[layoutId]||profiles['distributed-header']}
 function backCoverZones(typeId,layoutId){
  const profiles={
    'school-information':{'centered-information':{primary:[35,22,30,20],identity:[25,54,50,32]},'lower-information':{primary:[36,25,28,20],identity:[18,69,64,19]},'left-information':{primary:[10,12,30,14],identity:[10,34,55,52]}},
    'year-school-information':{'centered-year':{year:[29,17,42,18],identity:[25,48,50,38]},'split-year-information':{year:[8,25,38,24],identity:[55,24,37,56]},'top-year-information':{year:[26,8,48,19],identity:[20,58,60,29]}},
    'school-photo-information':{'center-photo':{year:[32,6,36,13],image:[24,23,52,43],identity:[20,72,60,20]},'left-photo':{year:[61,8,31,16],image:[7,14,48,67],identity:[61,35,31,48]},'right-photo':{year:[8,8,31,16],image:[45,14,48,67],identity:[8,35,31,48]}}
   };
  const defaults={'school-information':'centered-information','year-school-information':'centered-year','school-photo-information':'center-photo'};
  return profiles[typeId]?.[layoutId]||profiles[typeId]?.[defaults[typeId]]||profiles['school-information']['centered-information'];
 }
 function backCoverIdentityBoxes(zone,layoutId,{logo=false,names=0,details=0}={}){
  const sideBySide=layoutId==='split-year-information';
  const spread=(count,area)=>{if(!count)return [];const gap=count>4?.6:count>1?1.5:0,h=Math.max(1.5,(area[3]-gap*(count-1))/count);return Array.from({length:count},(_,index)=>{const y=area[1]+index*(h+gap);return {x:area[0],y,width:area[2],height:Math.max(1.5,Math.min(h,area[1]+area[3]-y))}})};
  const logoWidth=Math.min(22,zone[2]*.44),logoHeight=Math.min(12,Math.max(9,zone[3]*.32));
  const logoBox=logo?{x:sideBySide||layoutId==='left-information'?zone[0]:zone[0]+(zone[2]-logoWidth)/2,y:zone[1],width:logoWidth,height:logoHeight}:null;
  const offset=sideBySide&&logo?Math.min(24,zone[2]*.48):0,textX=zone[0]+offset,textWidth=zone[2]-offset;
  const nameY=!sideBySide&&logo?logoBox.y+logoBox.height+3:zone[1],nameHeight=names?Math.min(12,Math.max(7,zone[3]*.30)):0;
  const detailY=nameY+nameHeight+1,detailHeight=Math.max(3,zone[1]+zone[3]-detailY);
  return {logo:logoBox,names:spread(names,[textX,nameY,textWidth,nameHeight]),details:spread(details,[textX,detailY,textWidth,detailHeight]),sideBySide};
 }
 function annualZones(layoutId){return {title:{x:34,y:5,width:32,height:11},content:{x:layoutId==='vertical-three-month-groups'?6:7,y:20,width:layoutId==='vertical-three-month-groups'?88:86,height:73},logo:{x:7,y:5,width:12,height:11}}}
 root.ACDLPageCompositionPolicy=freeze({rules,rule,initial,validate,schoolSymbolBoxes,schoolIntroductionBoxes,twelveMonthZones,annualZones,coverZones,monthHeaderZones,backCoverZones,backCoverIdentityBoxes});
})(typeof window==='undefined'?globalThis:window);
