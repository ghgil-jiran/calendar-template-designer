(function(root){
 'use strict';
 const pages={cover:'표지','month-front':'월력 앞면','month-back':'월력 뒷면',symbols:'학교 상징',year:'연력',planner:'월 플래너','back-cover':'뒷표지'};
 const palettes={mist:['#FAFBF9','#99B9CB','#B7C9B5','#455F75'],spring:['#FCFBF7','#B4CBA4','#E3BEBB','#52634D'],summer:['#F8FCFC','#94BEC7','#B6D4CC','#3E6571'],autumn:['#FCFAF6','#C9AF91','#D5C3A9','#70604D'],winter:['#FAFBFD','#ACBCD2','#C9C9DA','#526078']};
 const fail=()=>{throw new Error('벡터 생성 설정을 확인해주세요.');};
 function normalize(input={}){
  const p={schemaVersion:'graphic-vector-design.v1',size:input.size||'desk-standard',kind:input.kind||'background',page:input.page||'cover',style:input.style||'circle',palette:input.palette||'mist',gradient:input.gradient??55,density:input.density??45,scale:input.scale??100,variation:input.variation||'same',orientation:input.orientation||'normal',colors:input.colors||null};
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
  if(p.page==='cover')return [{type:'text',label:'연도 · 제목',x:7,y:13,w:34,h:23},{type:'photo',label:'학교 전경 사진',x:43,y:11,w:49,h:67,shape:'circle'},{type:'photo',label:'활동 사진',x:9,y:44,w:30,h:42,shape:'circle'},{type:'footer',label:'교표 · 학교명 · 주소 · 연락처',x:0,y:88,w:100,h:12}];
  if(p.page==='month-front')return [{type:'text',label:'월 표시',x:7,y:9,w:24,h:13},{type:'grid',label:'월력 격자 · 일정',x:7,y:28,w:86,h:59}];
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${p.kind==='background'?`<rect width="${w}" height="${h}" fill="${bg}"/>`:''}${p.orientation==='mirror'?`<g transform="translate(1300 0) scale(-1 1)">${shapes}</g>`:shapes}</svg>`;
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
  return {design:normalize(p),applied};
 }
 root.ACDLGraphicVectorDesign=Object.freeze({pages,palettes,normalize,svg,zones,setInfo,applyPrompt});
})(typeof window==='undefined'?globalThis:window);
