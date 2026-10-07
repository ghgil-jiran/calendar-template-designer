(function(root){
 'use strict';
 const pages={cover:'표지','month-front':'월력 앞면','month-back':'월력 뒷면',symbols:'학교 상징',year:'연력',planner:'월 플래너','back-cover':'뒷표지'};
 const palettes={mist:['#FAFBF9','#99B9CB','#B7C9B5','#455F75'],spring:['#FCFBF7','#B4CBA4','#E3BEBB','#52634D'],summer:['#F8FCFC','#94BEC7','#B6D4CC','#3E6571'],autumn:['#FCFAF6','#C9AF91','#D5C3A9','#70604D'],winter:['#FAFBFD','#ACBCD2','#C9C9DA','#526078']};
 const fail=()=>{throw new Error('벡터 생성 설정을 확인해주세요.');};
 function normalize(input={}){
  const p={schemaVersion:'graphic-vector-design.v1',composition:input.composition||null,size:input.size||'desk-standard',kind:input.kind||'background',page:input.page||'cover',style:input.style||'circle',palette:input.palette||'mist',gradient:input.gradient??55,density:input.density??45,scale:input.scale??100,variation:input.variation||'same',orientation:input.orientation||'normal',layout:input.layout||'auto',scene:input.scene||null,colors:input.colors||null};
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
  if(p.composition==='cover-circle-01')return [{type:'text',label:'연도 · 제목',x:7,y:13,w:34,h:23},{type:'photo',label:'학교 전경 사진',x:43,y:10,w:49,h:70.777778,shape:'circle'},{type:'photo',label:'활동 사진',x:9,y:46,w:28,h:40.444444,shape:'circle'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='cover'&&p.layout==='text-only')return [{type:'text',label:'연도 · 제목 · 학교명',x:12,y:22,w:76,h:44},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='cover'&&p.layout==='single-photo')return [{type:'text',label:'연도 · 제목',x:8,y:8,w:44,h:15},{type:'photo',label:'학교 전경 사진',x:8,y:28,w:84,h:53},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='cover')return [{type:'text',label:'연도 · 제목',x:7,y:13,w:34,h:23},{type:'photo',label:'학교 전경 사진',x:43,y:11,w:49,h:67,shape:'circle'},{type:'photo',label:'활동 사진',x:9,y:44,w:30,h:42,shape:'circle'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='month-front')return [{type:'text',label:'월 표시',x:7,y:9,w:24,h:13},{type:'grid',label:'월력 격자 · 일정',x:7,y:28,w:86,h:59}];
  if(p.page==='month-back'&&p.layout==='two-photos')return [{type:'photo',label:'월별 사진 1',x:8,y:19,w:40,h:62},{type:'photo',label:'월별 사진 2',x:52,y:19,w:40,h:62}];
  if(p.page==='month-back'&&p.layout==='text-only')return [{type:'text',label:'제목',x:8,y:9,w:55,h:12},{type:'grid',label:'일정 · 메모 콘텐츠',x:8,y:27,w:84,h:58}];
  if(p.page==='month-back')return [{type:'photo',label:'월별 사진 / 콘텐츠',x:9,y:16,w:82,h:67}];
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
  if(p.composition==='cover-circle-01')shapes=coverCircle(p,{bg,a,b,ink,fillA,fillB,s,d});
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
  let p=normalize(input);const applied=[];const rules=[[/그라데이션\s*(?:없|제거)|단색/,{gradient:0},'그라데이션 제거'],[/그라데이션\s*(?:강|진)/,{gradient:85},'그라데이션 강화'],[/장식\s*(?:없|제거)/,{density:0},'장식 제거'],[/장식\s*(?:적|줄|성기)|간결|단순/,{density:20},'장식 밀도 축소'],[/장식\s*(?:많|늘|촘촘)/,{density:85},'장식 밀도 증가'],[/작게|크기\s*(?:줄|작)/,{scale:75},'장식 크기 축소'],[/크게|크기\s*(?:늘|크)/,{scale:125},'장식 크기 확대'],[/좌우\s*(?:반전|바꾸)|반대쪽/,{orientation:'mirror'},'좌우 반전'],[/원형|동그라미/,{style:'circle'},'원형 구성'],[/곡선/,{style:'curve'},'곡선 구성'],[/사선/,{style:'diagonal'},'사선 구성']];
  for(const [pattern,change,label] of rules)if(pattern.test(text)&&!(change.style&&p.kind==='illustration')){Object.assign(p,change);applied.push(label)}
  for(const [word,id] of [['봄','spring'],['여름','summer'],['가을','autumn'],['겨울','winter'],['차분','mist']])if(text.includes(word)){p.palette=id;p.colors=[...palettes[id]];applied.push(word+' 색상')}
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
 function coverCircle(p,{bg,a,b,ink,fillA,fillB,s,d}){
  const large=338+(s-1)*30,small=200+(s-1)*22;
  let out=`<path d="M1300 0H1035C1140 110 1270 258 1190 438C1090 655 880 660 670 729C484 790 313 875 110 900H1300Z" fill="${fillB}" opacity=".48"/><path d="M0 700C165 605 226 355 423 381C535 396 556 622 753 728C912 814 1168 735 1300 660V900H0Z" fill="${fillA}" opacity=".36"/><circle cx="877.5" cy="408.5" r="${large}" fill="${fillA}"/><circle cx="877.5" cy="408.5" r="310" fill="${bg}"/><circle cx="299" cy="596" r="${small}" fill="${fillB}"/><circle cx="299" cy="596" r="175" fill="${bg}"/><path d="M668 140C737 83 833 65 930 83M572 652C650 723 758 755 850 746" fill="none" stroke="${ink}" stroke-width="2" opacity=".3"/>`;
  for(let i=0;i<Math.round(d*7);i++){const x=1070+(i%3)*48,y=709+Math.floor(i/3)*30;out+=`<circle cx="${x}" cy="${y}" r="${5+(i%2)*2}" fill="${a}" opacity=".65"/>`;}
  out+=`<circle cx="113" cy="421" r="${22*s}" fill="${a}" opacity=".7"/><circle cx="480" cy="771" r="${32*s}" fill="${b}" opacity=".75"/><rect x="0" y="792" width="1300" height="108" fill="${fillB}"/><path d="M0 792H1300" stroke="${b}" stroke-width="2" opacity=".6"/>`;
  return out;
 }
 root.ACDLGraphicVectorDesign=Object.freeze({pages,palettes,normalize,svg,zones,setInfo,applyPrompt,validateScene});
})(typeof window==='undefined'?globalThis:window);
