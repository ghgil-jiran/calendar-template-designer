(function(root){
 'use strict';
 const pages={cover:'표지','cover-inside':'표지 안쪽','interleaf-front':'간지 앞면','interleaf-back':'간지 뒷면','rear-interleaf-front':'뒷간지 앞면','rear-interleaf-back':'뒷간지 뒷면','month-front':'월력 앞면','month-back':'월력 뒷면',symbols:'학교 상징',year:'연력',planner:'월 플래너','back-cover':'뒷표지'};
 const palettes={terracotta:['#FCF9F3','#C48770','#D6C4A8','#745344'],mist:['#FAFBF9','#99B9CB','#B7C9B5','#455F75'],spring:['#FCFBF7','#B4CBA4','#E3BEBB','#52634D'],summer:['#F8FCFC','#94BEC7','#B6D4CC','#3E6571'],autumn:['#FCFAF6','#C9AF91','#D5C3A9','#70604D'],winter:['#FAFBFD','#ACBCD2','#C9C9DA','#526078']};
 const fail=()=>{throw new Error('벡터 생성 설정을 확인해주세요.');};
 function normalize(input={}){
  const p={schemaVersion:'graphic-vector-design.v1',composition:input.composition||null,backgroundRevision:input.backgroundRevision||1,coverTuning:input.coverTuning||null,familyTuning:input.familyTuning||null,size:input.size||'desk-standard',kind:input.kind||'background',page:input.page||'cover',style:input.style||'circle',palette:input.palette||'mist',gradient:input.gradient??55,density:input.density??45,scale:input.scale??100,variation:input.variation||'same',orientation:input.orientation||'normal',layout:input.layout||'auto',scene:input.scene||null,colors:input.colors||null};
  if(![1,2].includes(p.backgroundRevision))fail();
  if(p.familyTuning){if(p.kind!=='background'||p.style!=='circle'||p.composition)fail();const q={};for(const key of ['tone','density','scale']){const v=p.familyTuning[key];if(!Number.isInteger(v)||v<50||v>150)fail();q[key]=v}p.familyTuning=q}
  if(p.coverTuning){if(p.composition!=='cover-circle-01')fail();const q={};for(const key of ['tone','density','scale']){const value=p.coverTuning[key];if(!Number.isInteger(value)||value<50||value>150)fail();q[key]=value}p.coverTuning=q}
  if(p.composition!==null&&p.composition!=='cover-circle-01')fail();if(p.composition&&(p.page!=='cover'||p.kind!=='background'))fail();if(p.composition){p.style='circle';p.layout='two-photos';p.orientation='normal';p.scene=null}
  if(!['auto','single-photo','two-photos','text-only'].includes(p.layout))fail();if(p.scene)p.scene=validateScene(p.scene);
  if(!['normal','mirror'].includes(p.orientation))fail();
  if(p.size!=='desk-standard'||!['background','illustration'].includes(p.kind)||!pages[p.page]||!['circle','curve','diagonal','plant','stationery'].includes(p.style)||!palettes[p.palette]||!['same','seasonal','monthly'].includes(p.variation))fail();
  if(p.kind==='background'&&!['circle','curve','diagonal'].includes(p.style)||p.kind==='illustration'&&!['plant','stationery'].includes(p.style))fail();
  for(const [key,min,max] of [['gradient',0,100],['density',0,100],['scale',60,140]])if(!Number.isInteger(p[key])||p[key]<min||p[key]>max)fail();
  if(p.colors!==null&&(!Array.isArray(p.colors)||p.colors.length!==4||p.colors.some(c=>typeof c!=='string'||!/^#[0-9a-f]{6}$/i.test(c))))fail();
  p.colors=p.colors?[...p.colors]:[...palettes[p.palette]];
  if(!p.page.startsWith('month-'))p.variation='same';
  return p;
 }
 function zones(p){
  if(p.kind==='illustration')return [];
  if(p.composition==='cover-circle-01'&&p.coverTuning)return [{type:'text',label:'연도 · SCHOOL CALENDAR',x:7,y:13,w:34,h:23},{type:'photo',label:'학교 전경 사진',x:42,y:8,w:51,h:73.666667,shape:'circle'},{type:'photo',label:'활동 사진',x:12,y:42,w:29,h:41.888889,shape:'circle'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:84.4,w:100,h:15.6}];
  if(p.composition==='cover-circle-01')return [{type:'text',label:'연도 · 제목',x:7,y:13,w:34,h:23},{type:'photo',label:'학교 전경 사진',x:43,y:10,w:49,h:70.777778,shape:'circle'},{type:'photo',label:'활동 사진',x:9,y:46,w:28,h:40.444444,shape:'circle'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='cover'&&p.layout==='text-only')return [{type:'text',label:'연도 · 제목 · 학교명',x:12,y:22,w:76,h:44},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='cover'&&p.layout==='single-photo')return [{type:'text',label:'연도 · 제목',x:8,y:8,w:44,h:15},{type:'photo',label:'학교 전경 사진',x:8,y:28,w:84,h:53},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='cover')return [{type:'text',label:'연도 · 제목',x:7,y:13,w:34,h:23},{type:'photo',label:'학교 전경 사진',x:43,y:11,w:49,h:67,shape:'circle'},{type:'photo',label:'활동 사진',x:9,y:44,w:30,h:42,shape:'circle'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='month-front')return [{type:'text',label:'월 표시',x:7,y:9,w:24,h:13},{type:'grid',label:'월력 격자 · 일정',x:7,y:28,w:86,h:59}];
  if(p.page==='month-back'&&p.layout==='two-photos')return [{type:'photo',label:'월별 사진 1',x:8,y:19,w:40,h:62},{type:'photo',label:'월별 사진 2',x:52,y:19,w:40,h:62}];
  if(p.page==='month-back'&&p.layout==='text-only')return [{type:'text',label:'제목',x:8,y:9,w:55,h:12},{type:'grid',label:'일정 · 메모 콘텐츠',x:8,y:27,w:84,h:58}];
  if(p.page==='month-back')return [{type:'photo',label:'월별 사진 / 콘텐츠',x:9,y:16,w:82,h:67}];
  if(['cover-inside','interleaf-front','interleaf-back','rear-interleaf-front','rear-interleaf-back'].includes(p.page))return [{type:'text',label:'페이지 제목',x:8,y:9,w:60,h:12},{type:'grid',label:'사진 · 연력 · 상징 · 안내 콘텐츠',x:8,y:27,w:84,h:59}];
  if(p.page==='symbols')return [{type:'text',label:'학교 상징',x:8,y:9,w:35,h:12},{type:'grid',label:'교표 · 교화 · 교목 · 교가',x:9,y:28,w:82,h:56}];
  if(p.page==='year')return [{type:'text',label:'연도 · 제목',x:8,y:8,w:36,h:12},{type:'grid',label:'12개월 연력',x:8,y:25,w:84,h:61}];
  if(p.page==='planner')return [{type:'text',label:'월 플래너 제목',x:8,y:9,w:38,h:12},{type:'grid',label:'계획 · 메모',x:8,y:27,w:84,h:58}];
  return [{type:'text',label:'학교명 · 안내',x:18,y:27,w:64,h:39},{type:'footer',label:'교표 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
 }
 function svg(input={},month=3){
  const p=normalize(input),c=monthColors(p,month),[bg,a,b,ink]=c,w=1300,h=900,s=p.scale/100,d=p.density/100,g=p.gradient/100;
  const blend=(from,to,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(from.slice(i,i+2),16)*(1-t)+parseInt(to.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
  const defs=`<defs><linearGradient id="gl-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${blend(a,bg,g)}"/></linearGradient><radialGradient id="gl-b"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${blend(b,bg,g)}"/></radialGradient></defs>`;
  const fillA=g? 'url(#gl-a)':a,fillB=g?'url(#gl-b)':b,opacity=(.22+g*.48).toFixed(2);
  let shapes='';
  if(p.kind==='background'){
   if(p.style==='circle')shapes=`<circle cx="-45" cy="480" r="${170*s}" fill="${fillB}" opacity="${opacity}"/><circle cx="1270" cy="-80" r="${225*s}" fill="${fillA}" opacity="${opacity}"/><circle cx="1350" cy="820" r="${170*s}" fill="${fillB}" opacity="${opacity}"/>`;
   if(p.style==='curve')shapes=`<path d="M0 0H1300V${65*s}Q980 ${10*s} 760 ${45*s}T0 ${75*s}Z" fill="${fillA}" opacity="${opacity}"/><path d="M0 900V${900-120*s}Q230 ${900-5*s} 460 ${900-30*s}T1300 ${900-100*s}V900Z" fill="${fillB}" opacity="${opacity}"/>`;
   if(p.style==='diagonal')shapes=`<path d="M0 0H${150*s}L0 ${130*s}Z" fill="${fillB}" opacity="${opacity}"/><path d="M1100 0H1300V${150*s}Z" fill="${fillA}" opacity="${opacity}"/><path d="M0 730L170 900H0Z" fill="${fillA}" opacity="${opacity}"/><path d="M1130 900L1300 730V900Z" fill="${fillB}" opacity="${opacity}"/>`;
   if(d>0)shapes+=`<g fill="none" stroke="${a}" stroke-width="2" opacity="${(.25+d*.5).toFixed(2)}"><path d="M20 110Q110 75 100 0"/><path d="M1210 0Q1195 105 1280 155"/><path d="M1270 630Q1190 705 1245 785"/></g>`;
   if(d>0)shapes+=`<g fill="${b}" opacity=".5">${Array.from({length:Math.round(d*12)},(_,i)=>`<circle cx="${i%2?1240-(i%3)*22:35+(i%3)*24}" cy="${80+Math.floor(i/2)*115}" r="${(5+d*6)*s}"/>`).join('')}</g>`;
   if(['cover','back-cover'].includes(p.page))shapes+=`<rect x="0" y="792" width="1300" height="108" fill="${fillA}" opacity=".3"/>`;
  }else if(p.style==='plant'){
   shapes=`<g transform="translate(650 770) scale(${s})"><path d="M0 0Q-50-240 0-570M-10-210Q110-270 175-360M-18-350Q-140-405-195-475" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round"/><g fill="${fillB}"><ellipse cx="-82" cy="-430" rx="105" ry="43" transform="rotate(30 -82 -430)"/><ellipse cx="95" cy="-300" rx="100" ry="43" transform="rotate(-35 95 -300)"/><ellipse cx="-22" cy="-560" rx="43" ry="90"/></g><path d="M-135-120H135L105 0H-105Z" fill="${fillA}"/></g>`;
  }else shapes=`<g transform="translate(650 450) scale(${s})"><rect x="-230" y="-240" width="350" height="470" rx="22" fill="${fillA}"/><rect x="-192" y="-210" width="290" height="410" rx="10" fill="${bg}"/><g stroke="${b}" stroke-width="8"><path d="M-155-110H55M-155-50H55M-155 10H55M-155 70H55"/></g><g transform="rotate(20)"><rect x="175" y="-270" width="50" height="420" rx="8" fill="${fillB}"/><path d="M175 150H225L200 220Z" fill="${ink}"/></g></g>`;
  if(p.composition==='cover-circle-01')shapes=p.backgroundRevision===2?independentReference(p):p.coverTuning?coverReference(p):coverCircle(p,{bg,a,b,ink,fillA,fillB,s,d});
  else if(p.familyTuning){shapes=p.backgroundRevision===2?independentReference(p):familyReference(p,{bg,a,b,ink});}
  else if(p.scene){shapes=p.scene.shapes.map(shape=>sceneShape(shape,{...p,colors:c})).join('');if(p.orientation==='mirror')shapes=`<g transform="translate(1300 0) scale(-1 1)">${shapes}</g>`;if(p.kind==='background'){const holes=zones(p).map(z=>{const x=z.x*13,y=z.y*9,w=z.w*13,h=z.h*9;return `M${x} ${y}h${w}v${h}h-${w}Z`}).join('');shapes=`<defs><clipPath id="gl-safe"><path d="M0 0H1300V900H0Z${holes}" clip-rule="evenodd" fill-rule="evenodd"/></clipPath></defs><g clip-path="url(#gl-safe)">${shapes}</g>${['cover','back-cover'].includes(p.page)?`<rect x="0" y="792" width="1300" height="108" fill="${fillA}" opacity=".15"/>`:''}`;} }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${p.kind==='background'?`<rect width="${w}" height="${h}" fill="${bg}"/>`:''}${p.orientation==='mirror'&&!p.scene&&!p.composition?`<g transform="translate(1300 0) scale(-1 1)">${shapes}</g>`:shapes}</svg>`;
 }
 function monthColors(p,month){
  if(p.variation==='same')return [...p.colors];
  const season=month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';
  if(p.variation==='seasonal')return [...palettes[season]];
  const c=[...palettes[season]],blend=month%3*.08;
  c[1]='#'+[1,3,5].map(i=>Math.round(parseInt(c[1].slice(i,i+2),16)*(1-blend)+255*blend).toString(16).padStart(2,'0')).join('');return c;
 }
 function setInfo(input){const p=normalize(input);return p.page.startsWith('month-')?{schemaVersion:'graphic-month-set.v1',monthOrder:[3,4,5,6,7,8,9,10,11,12,1,2],variation:p.variation,scope:'background-only',months:[3,4,5,6,7,8,9,10,11,12,1,2].map(month=>({month,colors:monthColors(p,month)}))}:null;}
 function applyPrompt(input,text=''){
  let p=normalize(input);const applied=[];if(p.coverTuning||p.familyTuning){const tuningKey=p.coverTuning?'coverTuning':'familyTuning',q={...p[tuningKey]};for(const [word,key] of [['그라데이션(?: 농도)?','tone'],['(?:장식\\s*)?밀도','density'],['(?:장식\\s*)?크기','scale']]){const match=text.match(new RegExp(word+'\\s*(?:을|를|:|=)?\\s*(\\d{1,3})\\s*%?'));if(match&&Number(match[1])>=50&&Number(match[1])<=150){q[key]=Number(match[1]);applied.push(word+' '+q[key]+'%')}}for(const [pattern,key,delta,label] of [[/진하게|진한|농도.*높/, 'tone',15,'농도 증가'],[/옅게|연하게|은은|농도.*낮/,'tone',-15,'농도 감소'],[/촘촘|밀도.*높/,'density',15,'간격 좁힘'],[/여유|성기|장식\s*적게|밀도.*낮/,'density',-15,'간격 넓힘'],[/크게/,'scale',15,'장식 확대'],[/작게/,'scale',-15,'장식 축소']])if(pattern.test(text)){q[key]=Math.max(50,Math.min(150,q[key]+delta));applied.push(label)}for(const [word,id] of [['테라코타','terracotta'],['샌드','terracotta'],['웜 아이보리','terracotta'],['봄','spring'],['여름','summer'],['가을','autumn'],['겨울','winter'],['차분','mist']])if(text.includes(word)){p.palette=id;p.colors=[...palettes[id]];applied.push(word+' 색상')}for(const [word,index] of [['바탕',0],['강조 1',1],['강조 2',2],['선',3]]){const match=text.match(new RegExp(word+'\\s*(?:색상|색)?\\s*(?:을|를|:|=)?\\s*(#[0-9a-fA-F]{6})'));if(match){p.colors[index]=match[1];applied.push(word+' '+match[1])}}p[tuningKey]=q;return {design:normalize(p),applied,notices:/사진.*(?:이동|크기)|꽃|잎|추가/.test(text)?['사진 배치와 새 소재는 변경하지 않습니다.']:[]};} const rules=[[/그라데이션\s*(?:없|제거)|단색/,{gradient:0},'그라데이션 제거'],[/그라데이션\s*(?:강|진)/,{gradient:85},'그라데이션 강화'],[/장식\s*(?:없|제거)/,{density:0},'장식 제거'],[/장식\s*(?:적|줄|성기)|간결|단순/,{density:20},'장식 밀도 축소'],[/장식\s*(?:많|늘|촘촘)/,{density:85},'장식 밀도 증가'],[/작게|크기\s*(?:줄|작)/,{scale:75},'장식 크기 축소'],[/크게|크기\s*(?:늘|크)/,{scale:125},'장식 크기 확대'],[/좌우\s*(?:반전|바꾸)|반대쪽/,{orientation:'mirror'},'좌우 반전'],[/원형|동그라미/,{style:'circle'},'원형 구성'],[/곡선/,{style:'curve'},'곡선 구성'],[/사선/,{style:'diagonal'},'사선 구성']];
  for(const [pattern,change,label] of rules)if(pattern.test(text)&&!(change.style&&p.kind==='illustration')){Object.assign(p,change);applied.push(label)}
  for(const [word,id] of [['테라코타','terracotta'],['샌드','terracotta'],['웜 아이보리','terracotta'],['봄','spring'],['여름','summer'],['가을','autumn'],['겨울','winter'],['차분','mist']])if(text.includes(word)){p.palette=id;p.colors=[...palettes[id]];applied.push(word+' 색상')}
  const numeric=[['그라데이션','gradient',0,100],['(?:장식\\s*)?밀도','density',0,100],['(?:장식\\s*)?크기','scale',60,140]];
  for(const [word,key,min,max] of numeric){const match=text.match(new RegExp(word+'\\s*(?:을|를|은|는|:|=)?\\s*(\\d{1,4})\\s*%?'));if(match){const n=Number(match[1]);if(n>=min&&n<=max){p[key]=n;applied.push(word.replace('(?:장식\\s*)?','장식 ')+' '+n+'%')}}}
  if(/더\s*은은|더\s*부드럽|연하게/.test(text)){p.density=Math.max(0,p.density-15);applied.push('장식 밀도 15%p 낮춤')}
  for(const [word,index] of [['바탕',0],['강조 1',1],['강조 2',2],['선',3]]){const match=text.match(new RegExp(word+'\\s*(?:색상|색)?\\s*(?:을|를|:|=)?\\s*(#[0-9a-fA-F]{6})'));if(match){p.colors[index]=match[1];applied.push(word+' '+match[1])}}
  const notices=[];if(p.composition){if(/반전|반대쪽|곡선|사선|사진.*(?:이동|크게|작게|추가)|잎|꽃|캐릭터/.test(text))notices.push('구성 01의 사진 배치·도형 유형은 유지됩니다. 새 소재 추가와 위치 변경은 지원하지 않습니다.');p.style='circle';p.orientation='normal';}
  return {design:normalize(p),applied:applied.filter(label=>!p.composition||!['좌우 반전','곡선 구성','사선 구성'].includes(label)),notices};
 }
 function validateScene(scene){
  if(!scene||!Array.isArray(scene.shapes)||scene.shapes.length<1||scene.shapes.length>80)fail();
  const shapes=scene.shapes.map(v=>{if(!v||!['ellipse','rect','path'].includes(v.type)||!['flat','linear','radial'].includes(v.paint)||![0,1,2,3].includes(v.fill)||![-1,0,1,2,3].includes(v.stroke))fail();
   const q={type:v.type,paint:v.paint,fill:v.fill,stroke:v.stroke};for(const [key,min,max] of [['x',-1300,2600],['y',-900,1800],['width',0,2600],['height',0,1800],['radius',0,450],['rotate',-360,360],['strokeWidth',0,25],['opacity',.05,1]]){if(typeof v[key]!=='number'||!Number.isFinite(v[key])||v[key]<min||v[key]>max)fail();q[key]=v[key]}
   if(typeof v.path!=='string'||v.path.length>6000||!/^[MmLlHhVvCcSsQqTtAaZz0-9eE.,+\s-]*$/.test(v.path)||v.type==='path'&&!/^[Mm]/.test(v.path))fail();const numbers=v.path.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi)||[];if(numbers.some(n=>!Number.isFinite(Number(n))||Math.abs(Number(n))>5000))fail();q.path=v.path;return q;
  });if(JSON.stringify(shapes).length>120000)fail();return {schemaVersion:'graphic-vector-scene.v1',shapes};
 }
 function sceneShape(q,p){const colors=p.colors,fill=q.paint==='flat'?colors[q.fill]:q.paint==='linear'?'url(#gl-a)':'url(#gl-b)',attrs=`fill="${fill}" stroke="${q.stroke<0?'none':colors[q.stroke]}" stroke-width="${q.strokeWidth}" opacity="${q.opacity}" transform="rotate(${q.rotate} ${q.x+q.width/2} ${q.y+q.height/2})"`;return q.type==='path'?`<path d="${q.path}" ${attrs}/>`:q.type==='ellipse'?`<ellipse cx="${q.x+q.width/2}" cy="${q.y+q.height/2}" rx="${q.width/2}" ry="${q.height/2}" ${attrs}/>`:`<rect x="${q.x}" y="${q.y}" width="${q.width}" height="${q.height}" rx="${q.radius}" ${attrs}/>`;}
 function independentReference(p){
  const [bg,a,b,ink]=p.colors,q=p.coverTuning||p.familyTuning||{tone:100,density:100,scale:100},t=q.tone/100,k=q.scale/100,shift=(100-q.density)*1.1;
  const tint=(c,v)=>'#'+[1,3,5].map(i=>Math.round(parseInt(bg.slice(i,i+2),16)*(1-Math.min(1,v))+parseInt(c.slice(i,i+2),16)*Math.min(1,v)).toString(16).padStart(2,'0')).join('');
  const quiet=p.page==='month-front'||['year','planner'].includes(p.page),strength=quiet?.55:1;
  let out=`<defs><linearGradient id="ind-blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${tint(a,.65*t*strength)}"/><stop offset="1" stop-color="${tint(a,.12*t*strength)}"/></linearGradient><linearGradient id="ind-sage" x1="0" y1="1" x2="1" y2="0"><stop stop-color="${tint(b,.6*t*strength)}"/><stop offset="1" stop-color="${tint(b,.09*t*strength)}"/></linearGradient></defs>`;
  // A page-wide composition; content example zones never participate in geometry.
  const cover=p.page==='cover',back=p.page==='month-back';
  const circles=cover?[[-65,-90,340,'sage'],[1230,-115,305,'blue'],[-170,675,380,'blue'],[1420,810,350,'sage'],[1100,145,135,'sage'],[85,365,95,'sage']]:back?[[-100,105,355,'blue'],[55,35,190,'sage'],[1390,815,390,'sage'],[1200,925,230,'blue'],[-55,775,185,'sage'],[1270,120,120,'blue']]:[[-130,100,330,'sage'],[1360,850,335,'blue'],[-85,790,165,'blue'],[1300,-70,200,'sage']];
  const mirror=['interleaf-back','rear-interleaf-front','back-cover'].includes(p.page);
  out+=`<g${mirror?' transform="translate(1300 0) scale(-1 1)"':''}>`;
  for(const [cx,cy,r,color] of circles){const x=cx+(cx<650?-shift:shift),y=cy+(cy<450?-shift*.45:shift*.45);out+=`<circle cx="${x}" cy="${y}" r="${r*k}" fill="url(#ind-${color})"/><circle cx="${x}" cy="${y}" r="${(r+26)*k}" fill="none" stroke="${tint(color==='blue'?a:b,.42*t*strength)}" stroke-width="1.8"/>`;}
  const arcs=cover?[[110,110,245],[1190,750,260],[40,760,340]]:back?[[10,90,420],[1300,850,440],[1120,-90,235]]:[[0,120,385],[1300,850,390]];
  for(const [x,y,r] of arcs)out+=`<circle cx="${x+(x<650?-shift:shift)}" cy="${y}" r="${r*k}" fill="none" stroke="${tint(ink,.2*t*strength)}" stroke-width="1.4" stroke-dasharray="${r*2.3} ${r*4}" transform="rotate(24 ${x} ${y})"/>`;
  const dots=cover?[[235,80,13],[75,480,17],[1190,315,14],[1060,800,10]]:back?[[275,100,12],[105,365,16],[1085,735,14],[1220,555,10]]:[[160,185,12],[1160,715,14]];
  for(const [x,y,r] of dots)out+=`<circle cx="${x+(x<650?-shift:shift)}" cy="${y}" r="${r*k}" fill="${tint(x<650?a:b,.68*t*strength)}"/>`;
  return out+'</g>';
 }
 function familyReference(p,{bg,a,b,ink}){
  const q=p.familyTuning,s=q.scale/100,d=q.density/100,t=q.tone/100;
  const tint=c=>'#'+[1,3,5].map(i=>Math.round(parseInt(bg.slice(i,i+2),16)*(1-Math.min(1,t*.65))+parseInt(c.slice(i,i+2),16)*Math.min(1,t*.65)).toString(16).padStart(2,'0')).join('');
  const x=(v,edge)=>edge===0?v-(1-d)*100:v+(1-d)*100;
  const shapes=`<circle cx="${x(-45,0)}" cy="490" r="${155*s}" fill="${tint(b)}"/><circle cx="${x(1270,1300)}" cy="-90" r="${210*s}" fill="${tint(a)}"/><circle cx="${x(1365,1300)}" cy="835" r="${140*s}" fill="${tint(b)}"/><circle cx="${x(58,0)}" cy="170" r="${12*s}" fill="${a}" opacity=".65"/><circle cx="${x(1245,1300)}" cy="700" r="${18*s}" fill="${b}" opacity=".65"/><path d="M20 110Q110 75 100 0M1210 0Q1195 105 1280 155" fill="none" stroke="${ink}" stroke-width="1.6" opacity=".22"/>`;
  const holes=zones(p).map(z=>`M${z.x*13} ${z.y*9}h${z.w*13}v${z.h*9}h-${z.w*13}Z`).join('');
  return `<defs><clipPath id="gl-family-safe"><path d="M0 0H1300V900H0Z${holes}" clip-rule="evenodd" fill-rule="evenodd"/></clipPath></defs><g clip-path="url(#gl-family-safe)">${shapes}</g>${p.page==='back-cover'?`<rect y="792" width="1300" height="108" fill="url(#gl-a)" opacity="${Math.min(.8,t*.45)}"/>`:''}`;
 }
 function coverReference(p){
  const [bg,a,b,ink]=p.colors,t=p.coverTuning.tone/100,d=p.coverTuning.density/100,k=p.coverTuning.scale/100;
  const tint=(c,v)=>'#'+[1,3,5].map(i=>Math.round(parseInt(bg.slice(i,i+2),16)*(1-v)+parseInt(c.slice(i,i+2),16)*v).toString(16).padStart(2,'0')).join('');
  const ga=tint(a,.58*t),gb=tint(b,.55*t),fadeA=tint(a,.16*t),fadeB=tint(b,.13*t),shift=(1-d)*100;
  let out=`<defs><linearGradient id="cover-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ga}"/><stop offset="1" stop-color="${fadeA}"/></linearGradient><linearGradient id="cover-sage" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${gb}"/><stop offset="1" stop-color="${fadeB}"/></linearGradient><linearGradient id="cover-footer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${ga}"/><stop offset=".5" stop-color="${fadeA}"/><stop offset="1" stop-color="${ga}"/></linearGradient></defs>`;
  const circles=[[-100-shift,-70-shift,225,'sage'],[1240+shift,-80-shift,190,'blue'],[1410+shift,165,190,'sage'],[-150-shift,455,260,'sage'],[-160-shift,680,270,'blue'],[1420+shift,890+shift,290,'sage']];
  for(const [x,y,r,color] of circles)out+=`<circle cx="${x}" cy="${y}" r="${r*k}" fill="url(#cover-${color})"/><circle cx="${x}" cy="${y}" r="${(r+22)*k}" fill="none" stroke="${color==='blue'?ga:gb}" stroke-width="1.7"/>`;
  out+=`<path d="M177 421Q283 327 389 375M143 482Q100 607 178 688M1193 219Q1296 366 1243 524" fill="none" stroke="${ga}" stroke-width="1.7"/>`;
  const dots=[[158,46,a],[134-shift*.35,447,a],[1187+shift*.35,183,b],[1227+shift*.3,553,a]];for(const [x,y,c] of dots)out+=`<circle cx="${x}" cy="${y}" r="${15*k}" fill="${tint(c,.66*t)}"/>`;
  out+=`<rect x="0" y="759.6" width="1300" height="140.4" fill="url(#cover-footer)"/>`;return out;
 }
 function coverCircle(p,{bg,a,b,ink,fillA,fillB,s,d}){
  const large=338+(s-1)*30,small=200+(s-1)*22;
  let out=`<path d="M1300 0H1035C1140 110 1270 258 1190 438C1090 655 880 660 670 729C484 790 313 875 110 900H1300Z" fill="${fillB}" opacity=".48"/><path d="M0 700C165 605 226 355 423 381C535 396 556 622 753 728C912 814 1168 735 1300 660V900H0Z" fill="${fillA}" opacity=".36"/><circle cx="877.5" cy="408.5" r="${large}" fill="${fillA}"/><circle cx="877.5" cy="408.5" r="310" fill="${bg}"/><circle cx="299" cy="596" r="${small}" fill="${fillB}"/><circle cx="299" cy="596" r="175" fill="${bg}"/><path d="M668 140C737 83 833 65 930 83M572 652C650 723 758 755 850 746" fill="none" stroke="${ink}" stroke-width="2" opacity=".3"/>`;
  for(let i=0;i<Math.round(d*7);i++){const x=1070+(i%3)*48,y=709+Math.floor(i/3)*30;out+=`<circle cx="${x}" cy="${y}" r="${5+(i%2)*2}" fill="${a}" opacity=".65"/>`;}
  out+=`<circle cx="113" cy="421" r="${22*s}" fill="${a}" opacity=".7"/><circle cx="480" cy="771" r="${32*s}" fill="${b}" opacity=".75"/><rect x="0" y="792" width="1300" height="108" fill="${fillB}"/><path d="M0 792H1300" stroke="${b}" stroke-width="2" opacity=".6"/>`;
  return out;
 }
 root.ACDLGraphicVectorDesign=Object.freeze({pages,palettes,normalize,svg,zones,setInfo,applyPrompt,validateScene});
})(typeof window==='undefined'?globalThis:window);
