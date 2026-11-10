// Apply the requested original-reference corrections to the latest saved Sample C.
// School input, source PDFs, page order and unrelated designer objects are preserved.
import {readFile} from 'node:fs/promises';
import {getTemplate,listTemplates,saveVersion,storeTemplateAsset} from './template-persistence.js';
const KEY='desk-sample-c-seasonal-illustration-2027',REV='sample-c-reference-20261110-v3';
const files=name=>readFile(new URL('../assets/sample-c/'+name,import.meta.url));
const rect=(x,y,w,h)=>({x:(x-8.504)/737.008*100,y:(y-8.504)/510.236*100,width:w/737.008*100,height:h/510.236*100});
export function refineSampleCProject(project,assets){
 const p=structuredClone(project);if(p.template?.metadata?.sampleCRefinement===REV)return p;
 const E=p.book.elementsByPage;const get=id=>Object.values(E).flat().find(e=>e.id==='c.'+id);
 if(!get('cover.year')||!get('annual'))throw Error('Sample C authoring objects are missing');
 for(const list of Object.values(E))for(const e of list)if(e.id?.startsWith('c.')&&e.type==='text')e.style={...e.style,padding:0,fontReferenceWidthPx:260*96/25.4};
 const set=(id,frame,style={})=>{const e=get(id);if(e){Object.assign(e,frame);e.style={...e.style,...style};}return e;};
 const art=(id,frame,src)=>({id:'c.'+id,type:'image-frame',role:'decoration',...frame,zIndex:20,fit:'contain',image:{src,fit:'contain'},style:{background:false,strokeWidth:0},permissions:{move:false,resize:false,delete:false,replaceImage:false}});
 set('cover.year',rect(240,171,275,119),{fontFamily:'Times New Roman',fontSize:163.68,fontWeight:400});
 set('cover.calendar',rect(270,276,208,35),{fontFamily:'Times New Roman',fontSize:33.97});
 set('cover.logo',rect(60.4,468.8,30.7,30.7));
 set('cover.name',rect(100.7,470,115,22),{fontFamily:'SampleC SchoolName',fontSize:20,fontWeight:400});
 set('cover.english',rect(100.7,489,115,14),{fontSize:10.67});
 const divider=set('cover.divider',rect(220.4,471,.4,28.6),{fill:'#777777'});if(divider)Object.assign(divider.style,{strokeWidth:0,exactFrame:true});
 set('cover.address',rect(250.9,468,440,18),{fontSize:13.68});
 set('cover.contacts',rect(250.9,486,335,19),{fontSize:13.33});
 set('cover.website',rect(596.5,486,100,19),{fontSize:13.33,fontWeight:700});
 set('annual.year',rect(292,62,170,64),{fontFamily:'Times New Roman',fontSize:69.56,fontWeight:400});
 const label=set('annual.label',rect(320,118,115,17),{fontFamily:'Times New Roman',fontSize:14.44,fontWeight:400});if(label)label.content='C A L E N D A R';
 set('annual',rect(79,145,607,335),{columnGap:67,rowGap:16,titleSize:10.89,monthNumberSize:22.93,monthEnglishSize:10.89,monthNumberFontFamily:'Georgia',dateSize:10.49,fontFamily:'Arial',fontReferenceWidthPx:260*96/25.4});
 set('motto.pill',rect(198.6,152.9,50.69,18.15));set('motto.label',rect(198.6,152.9,50.69,18.15),{fontSize:16});set('motto.box',rect(95.6,163.9,258.57,49.48),{fill:'#cedfd1'});set('motto.value',rect(108,174,234,31),{fontSize:17.33});
 for(const [key,x] of [['tree',116.22],['flower',236.24]]){
  set(key+'.pill',rect(x+23.73,250.25,50.69,18.14));set(key+'.label',rect(x+23.73,250.25,50.69,18.14),{fontSize:16});set(key+'.photo',rect(x,282.55,98.14,65.43));
  set(key+'.name',rect(x-6.22,370,110,23),{fontSize:16});set(key+'.description',rect(x-17.22,391,132,40),{fontSize:13.33,lineHeight:1.5,verticalAlign:'top'});
 }
 set('song.pill',rect(474.4,152.9,120,18.15));set('song.label',rect(474.4,152.9,120,18.15),{fontSize:16});set('song.score',rect(402.37,187.23,255.68,248.95));
 const symbols=E['surface.2.front'];for(let i=symbols.length-1;i>=0;i--)if(['c.symbols.maple.top','c.symbols.maple.left'].includes(symbols[i].id))symbols.splice(i,1);
 const topLeaf=art('symbols.maple.top',rect(555.84,80.39,89.37,89.37),assets.leaf);topLeaf.rotation=180;symbols.push(topLeaf,art('symbols.maple.left',rect(36.53,229.61,89.37,89.37),assets.leaf));
 set('back.logo',rect(291,226,38,38));set('back.name',rect(345,229,135,26),{fontFamily:'SampleC SchoolName',fontSize:23.5,fontWeight:400});set('back.english',rect(341,249,142,18),{fontSize:14.44});
 set('back.address',rect(210,291,335,20),{fontSize:13.68});
 const contacts=set('back.contacts',rect(258,309,240,40),{fontSize:13.33});if(contacts)contacts.contactLayout='stacked-website';
 const website=set('back.website',rect(390,328,95,20),{fontSize:13.33,fontWeight:700});if(website)website.visible=false;
 for(const id of ['cover.english','cover.address','cover.contacts','cover.website','back.english','back.address','back.contacts','back.website']){const e=get(id);if(e)e.style.fontFamily='SampleC Dotum';}
 const miniColors=['#f3f8e6','#feede9','#fff1de','#e4f3ef','#e5f2e3','#e1e5f3','#d8e8e3','#fee9e3','#f5e5e3','#fee7df','#ebf4fb','#e1e5f3'];
 p.template.masters.calendar.calendarLayout.gridAppearance.mini.mode='monthly';
 const front=p.book.pageInstances.filter(q=>q.role==='monthly-front');
 front.forEach((q,i)=>{
  const key=q.monthKey;set(key+'.motto',{x:15.34,y:18.3,width:25,height:5},{fontFamily:'SampleC Slogan',fontSize:17});
  const entry=p.book.monthlyStyleOverrides.find(x=>x.monthKey===key);if(entry)entry.tokens={...entry.tokens,miniBackground:miniColors[i]};
 });
 const back=p.book.pageInstances.filter(q=>q.role==='monthly-back');
 back.forEach((q,i)=>{
  const key=q.monthKey,list=E[q.id],old=get(key+'.planner.icon');set(key+'.planner.panel',rect(28.63,66.13,696.76,431.56));if(old)list.splice(list.indexOf(old),1);for(let j=list.length-1;j>=0;j--)if(['c.'+key+'.planner.corner','c.'+key+'.planner.spark'].includes(list[j].id))list.splice(j,1);
  list.push(art(key+'.planner.corner',rect(642,32,88,67),assets['corner'+i]),art(key+'.planner.spark',rect(640,261,60,30),assets['spark'+i]));
 });
 p.template.metadata.sampleCRefinement=REV;return p;
}
export async function refineSampleC({list=listTemplates,get=getTemplate,save=saveVersion,store=storeTemplateAsset,read=files}={}){
 const item=(await list()).find(t=>t.stableKey===KEY);if(!item)throw Error('먼저 샘플 C를 등록해주세요.');
 const current=await get(item.id);if(current.version.projectData.template?.metadata?.sampleCRefinement===REV)return {completed:true,templateId:item.id,versionNumber:current.version.versionNumber,unchanged:true};
 const assets={};for(const [key,name] of [['leaf','maple-leaf.png'],...Array.from({length:12},(_,i)=>['corner'+i,`planner-corner-${String(i+1).padStart(2,'0')}.png`]),...Array.from({length:12},(_,i)=>['spark'+i,`planner-spark-${String(i+1).padStart(2,'0')}.png`])]){const all=Object.values(current.version.projectData.book.elementsByPage).flat();const id=key==='leaf'?'c.symbols.maple.top':key.startsWith('corner')?'c.'+current.version.projectData.book.pageInstances.filter(q=>q.role==='monthly-back')[Number(key.slice(6))].monthKey+'.planner.corner':'c.'+current.version.projectData.book.pageInstances.filter(q=>q.role==='monthly-back')[Number(key.slice(5))].monthKey+'.planner.spark';const prior=all.find(e=>e.id===id)?.image?.src;if(prior?.startsWith('acdl-asset://')){assets[key]=prior;continue;}assets[key]='acdl-asset://'+(await store('data:image/png;base64,'+(await read(name)).toString('base64'))).id;}
 const p=refineSampleCProject(current.version.projectData,assets);
 // Re-read immediately before saving rather than silently replacing a concurrent edit.
 if((await get(item.id)).version.id!==current.version.id)throw Error('다른 편집 내용이 저장됐습니다. 다시 실행하면 최신 저장본에 반영합니다.');
 const result=await save({templateId:item.id,stableKey:KEY,name:item.name,description:item.description,edition:item.edition,state:item.state,isStandard:item.isStandard,productType:item.productType,templateKey:item.templateKey,saveKind:'manual',sourceVersionId:current.version.id,saveNote:'샘플 C 원본 비교 보완: 표지·연력·학교상징·월력·플래너',schemaVersion:current.version.schemaVersion,projectData:p});
 return {completed:true,templateId:item.id,versionNumber:result.version.versionNumber};
}
