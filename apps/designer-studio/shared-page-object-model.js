/* Canonical editable parts: used before authoring, persistence and Runtime compilation. */
(function(root){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)), labels={'school-motto':'교훈','school-tree':'교목','school-flower':'교화','school-song':'교가'};
 const text=(base,id,role,content,binding,frame,size)=>({id,type:'text',role,content,binding:binding||null,fallbackToSample:true,...frame,zIndex:Number(base.zIndex||0)+1,visible:base.visible!==false,style:{fontFamily:base.style?.fontFamily||'',fontSize:size,color:base.style?.color||'#17202e',textAlign:base.style?.textAlign||'center',lineHeight:1.25},permissions:copy(base.permissions||{}),metadata:{editablePart:true,parentObjectId:base.id}});
 function monthText(element,year){
  const start=Number(element.planStartMonth||1),offset=Number(element.planMonthOffset||0),zero=start-1+offset,month=zero%12+1,target=Number(year)+Math.floor(zero/12),transition=target!==Number(year);
  return element.planMonthLabelStyle==='number-ko'?(transition?target+' ':'')+month+'월':month+' '+['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][month-1]+(transition?' · '+target:'');
 }
 function coverYearText(element,year){
  const value=String(year??element.content??'');
  return element.format==='year-ko'?value+'년':element.format==='academic-year'?value+'학년도':element.format==='year-range'?value+'–'+(Number(value)+1):value;
 }
 function splitCoverYear(elements,project,composition){
  for(const source of [...elements]){
   if(source.type!=='text'||source.role!=='year'||source.binding!=='calendar.year'||source.bindingEnabled===false||source.metadata?.coverYearPart)continue;
   const format=source.yearFormat||composition?.yearFormat;
   if(format!=='number-calendar')continue;
   const two=(source.yearLines||composition?.yearLines)==='two',x=Number(source.x||0),y=Number(source.y||0),w=Number(source.width||40),h=Number(source.height||16),style=copy(source.style||{});
   const label={...copy(source),id:source.id+'.calendar-label',role:'cover-calendar-label',binding:null,content:'CALENDAR',format:null,yearFormat:'number',yearLines:'one',style,metadata:{...source.metadata,editablePart:true,parentObjectId:source.id,coverYearPart:'label'}};
   source.metadata={...source.metadata,editablePart:true,coverYearPart:'year'};source.content=String(project.settings?.year||source.content||'').replace(/\s*CALENDAR\s*/g,'').trim();source.yearFormat='number';source.yearLines='one';
   if(two){source.height=h*.58;Object.assign(label,{x,y:y+h*.62,width:w,height:h*.38});}
   else {source.width=w*.4;Object.assign(label,{x:x+w*.43,y,width:w*.57,height:h});}
   elements.splice(elements.indexOf(source)+1,0,label);
  }
  return elements;
 }
 // Settings replace the registered sample; connected semantic objects keep their authored frame/text.
 function updateBoundSchoolImage(project,role,image,assetId){
  const key={'school-logo':'logo','school-building':'building','school-tree':'tree','school-flower':'flower','school-song':'song'}[role];
  if(!key)return 0;
  const binding='school.profile.'+key,arrays=[...Object.values(project?.book?.elementsByPage||{}),...Object.values(project?.template?.masterElements||{})];let count=0;
  for(const elements of arrays)for(const item of Array.isArray(elements)?elements:[]){
   if(item.type!=='semantic-object'||item.role!==role||item.bindingEnabled===false||item.binding!==binding)continue;
   item.sampleContent={...(item.sampleContent||{}),image:image||''};
   delete item.sampleContent.assetId;if(assetId)item.sampleContent.assetId=assetId;
   count++;
  }
  return count;
 }
 function schoolText(element,school){
  if(element?.bindingEnabled===false)return undefined;
  if(element?.binding==='school.name'&&element?.format==='school-song-title')return String(school?.name||'').trim()?String(school.name).trim()+' 교가':'교가';
  const path=element?.binding;
  if(!/^school\.profile\.(tree|flower)\.(name|description)$/.test(path||''))return undefined;
  return path.split('.').slice(1).reduce((value,key)=>value?.[key],school);
 }
 function connectSymbolText(elements){
  for(const e of elements){
   if(e.type!=='text'||e.metadata?.schoolSymbolBindingVersion||e.bindingEnabled===false)continue;
   let key,part;
   const generated=/^school-(tree|flower|song)-(title|description)$/.exec(e.role||'');
   const standard=/^symbols\.(tree|flower|song)\.(name|title|desc)$/.exec(e.id||'');
   if(generated){key=generated[1];part=generated[2];}
   else if(standard){key=standard[1];part=standard[2]==='desc'?'description':'title';}
   else {
    const suffix=/^(.*)\.(title|name|description)$/.exec(e.id||'');
    const parent=suffix&&elements.find(item=>item.id===suffix[1]&&/^school-(tree|flower|song)$/.test(item.role||''));
    if(!parent)continue;
    key=parent.role.replace('school-','');part=suffix[2]==='description'?'description':'title';
    // A category heading and a separately bound name are two distinct authored parts.
    if(key!=='song'&&suffix[2]==='title'&&elements.some(item=>item.id===suffix[1]+'.name'&&item.binding===`school.profile.${key}.name`))continue;
   }
   const binding=key==='song'&&part==='title'?'school.name':`school.profile.${key}.${part==='title'?'name':'description'}`;
   if(e.binding&&e.binding!==binding)continue;
   e.binding=binding;e.bindingEnabled=true;
   if(key==='song'&&part==='title')e.format='school-song-title';
   e.metadata={...e.metadata,schoolSymbolBindingVersion:1};
  }
 }
 function normalizeProject(project){
  if(!project?.book||!project?.template||project.productionCorrection)return project;
  const pages=project.book.pageInstances||[],symbolPage=p=>[p?.role,p?.contentPurpose,p?.semanticPageRole,p?.packageRole].some(v=>v==='school-symbols');
  const arrays=[...Object.entries(project.template.masterElements||{}).map(([id,arr])=>({arr,symbols:pages.some(p=>p.masterId===id&&symbolPage(p)),cover:pages.some(p=>p.masterId===id&&p.role==='cover-front')})),...Object.entries(project.book.elementsByPage||{}).map(([id,arr])=>({arr,symbols:symbolPage(pages.find(p=>p.id===id)),cover:pages.some(p=>p.id===id&&p.role==='cover-front')}))];
  for(const {arr,symbols,cover} of arrays){
   if(cover)splitCoverYear(arr,project,project.template.settings?.aiDesignSpec?.pageSettings?.roleCompositions?.cover);
   const next=[];
   for(const source of arr){
    if(symbols&&source.type==='semantic-object'&&labels[source.role]&&!source.metadata?.editablePartsVersion){
     const e=copy(source),x=Number(e.x||0),y=Number(e.y||0),w=Number(e.width||30),h=Number(e.height||30),key=e.role.replace('school-',''),data=e.sampleContent||project.book.school?.profile?.[key]||{};
     const titleH=Math.min(7,h*.18),descriptionH=Math.min(12,h*.26),title=labels[e.role];
     next.push(text(e,e.id+'.title',e.role+'-title',title,null,{x,y,width:w,height:titleH},Number(e.style?.titleSize||18)));
     if(e.role==='school-motto'){
      next.push(text(e,e.id,e.role,data.description||'',`school.profile.${key}.description`,{x,y:y+titleH,width:w,height:Math.max(3,h-titleH)},Number(e.style?.descriptionSize||11)));
     }else{
      e.metadata={...e.metadata,editablePartsVersion:1};e.showTitle=false;e.showCaption=false;e.layoutPreset='image-only';e.y=y+titleH;e.height=Math.max(3,h-titleH-(key==='song'?0:descriptionH));next.push(e);
      if(key!=='song')next.push(text(e,e.id+'.description',e.role+'-description',data.description||'',`school.profile.${key}.description`,{x,y:y+h-descriptionH,width:w,height:descriptionH},Number(e.style?.descriptionSize||11)));
     }
    }else if(source.type==='memo'&&source.memoLayout==='yearly-grid'&&!source.metadata?.editablePartsVersion){
     const e=source,x=Number(e.x||0),y=Number(e.y||0),w=Number(e.width||90),h=Number(e.height||80),columns=Math.max(2,Math.min(6,Number(e.yearlyColumns||4))),rows=Math.ceil(12/columns),header=Math.min(8,h*.12),gap=1,cellW=(w-gap*(columns-1))/columns,cellH=(h-header-gap*(rows-1))/rows;
     next.push(text(e,e.id+'.title','yearly-plan-title',e.title||'Yearly Plan',null,{x,y,width:w,height:header},Number(e.style?.titleSize||12)));
     for(let index=0;index<12;index++){
      let col=index%columns,row=Math.floor(index/columns);
      if(e.yearlyLayoutType==='yearly-vertical-groups'){col=Math.floor(index/3);row=index%3;}
      const actualCols=e.yearlyLayoutType==='yearly-vertical-groups'?4:columns,actualRows=e.yearlyLayoutType==='yearly-vertical-groups'?3:rows,cw=(w-gap*(actualCols-1))/actualCols,ch=(h-header-gap*(actualRows-1))/actualRows,cx=x+col*(cw+gap),cy=y+header+row*(ch+gap),labelH=Math.min(5,ch*.24);
      const label=text(e,e.id+'.month.'+index,'yearly-plan-month','', 'calendar.year',{x:cx,y:cy,width:cw,height:labelH},Number(e.style?.monthTitleSize||10));Object.assign(label,{format:'plan-month',planStartMonth:e.startMonth||project.settings?.startMonth||1,planMonthOffset:index,planMonthLabelStyle:e.monthLabelStyle||'number-en'});label.content=monthText(label,project.settings?.year||2027);next.push(label);
      const card=e.yearlyLayoutType==='yearly-month-cards';
      if(card)next.push({id:e.id+'.cell.'+index,type:'shape',shapeType:'rect',x:cx,y:cy,width:cw,height:ch,zIndex:Number(e.zIndex||0),style:{fill:'#ffffff',stroke:e.style?.lineColor||'#d7dce5',strokeWidth:1,borderRadius:8},permissions:copy(e.permissions||{}),metadata:{editablePartsVersion:1,parentObjectId:e.id}});
      next.push({...copy(e),style:{...e.style,background:'transparent',borderWidth:0},id:e.id+'.lines.'+index,role:'yearly-plan-lines',memoLayout:'lines',title:'',hideTitle:true,x:cx,y:cy+labelH,width:cw,height:Math.max(2,ch-labelH),lineCount:e.linesPerMonth??4,metadata:{editablePartsVersion:1,parentObjectId:e.id}});
     }
    }else next.push(source);
   }
   if(symbols)connectSymbolText(next);
   arr.splice(0,arr.length,...next);
  }
  return project;
 }
 function renderPlanLines(element){
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),s=element.style||{},line=/^#[0-9a-f]{3,8}$/i.test(s.lineColor||'')?s.lineColor:'#d7dce5',count=Math.max(0,Math.min(20,Number(element.lineCount??4)));
  return '<div class="widget-memo editable-plan-lines" style="border:0;border-radius:0;background:transparent;padding:4px;height:100%;box-sizing:border-box"><div style="position:relative;height:100%">'+Array.from({length:count},(_,i)=>'<span data-print-rule="'+(i+1)+'" style="position:absolute;left:0;right:0;top:'+((i+1)/count*100)+'%;border-bottom:1px solid '+escape(line)+'"></span>').join('')+'</div></div>';
 }

 // Contact display order is independent of input-row order. Keep complete
 // label/number pairs together and let the authored frame decide line breaks.
 function schoolContactItems(input){
  const school=input&&typeof input==='object'&&!Array.isArray(input)?input:{},rows=Array.isArray(input)?input:Array.isArray(school.contacts)?school.contacts:[],phones=[],faxes=[];
  const clean=value=>value==null?'':String(value).trim(),isFax=label=>/팩스|fax/i.test(label),rank=label=>label.includes('교무실')?0:label.includes('행정실')?1:2;
  rows.forEach((row,index)=>{
   if(!row||typeof row!=='object')return;
   const label=clean(row.label)||({academic:'교무실',admin:'행정실',fax:'팩스'}[row.type])||'연락처',phone=clean(row.phone||row.value),fax=clean(row.fax);
   if(isFax(label)){if(phone||fax)faxes.push({label,value:fax||phone,index});}
   else {if(phone)phones.push({label,value:phone,index});if(fax)faxes.push({label,value:fax,index});}
  });
  if(!phones.length&&clean(school.phone))phones.push({label:'교무실',value:clean(school.phone),index:0});
  if(!faxes.length&&clean(school.fax))faxes.push({label:'팩스',value:clean(school.fax),index:0});
  const order=(a,b)=>rank(a.label)-rank(b.label)||a.index-b.index;
  phones.sort(order);faxes.sort(order);
  return [...phones.map(({label,value})=>({label,value,kind:'phone'})),...faxes.map(({label,value})=>({label:isFax(label)?label:faxes.length>1?label+' 팩스':'팩스',value,kind:'fax'}))];
 }
 function schoolContactsText(input){return schoolContactItems(input).map(item=>item.label+' '+item.value).join(' · ');}
 function renderSchoolContacts(input,options={}){
  const items=schoolContactItems(input);if(!items.length)return '';
  if(options.contactLayout==='stacked-website'){const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const pair=i=>'<span style="white-space:nowrap"><strong style="font-weight:700">'+esc(i.kind==='fax'?'FAX':i.label)+'</strong>&nbsp;'+esc(i.value)+'</span>';return '<div class="school-contact-list" style="width:100%;text-align:center;line-height:1.6"><div style="display:flex;justify-content:center;gap:.8em">'+items.filter(i=>i.kind==='phone').map(pair).join('')+'</div><div style="display:flex;justify-content:center;gap:.8em">'+items.filter(i=>i.kind==='fax').map(pair).join('')+(input.website?'<strong style="font-weight:700">'+esc(input.website)+'</strong>':'')+'</div></div>';}
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return '<div class="school-contact-list" style="display:flex;flex-wrap:wrap;justify-content:inherit;align-content:flex-start;column-gap:.8em;row-gap:0;width:100%;min-width:0;white-space:normal">'+items.map(item=>'<span class="school-contact-item" style="display:inline-block;white-space:nowrap">'+'<strong style="font-weight:700">'+escape(item.label)+'</strong>&nbsp;'+escape(item.value)+'</span>').join('')+'</div>';
 }
 root.ACDLPageObjectModel=Object.freeze({version:'1.1.0',normalizeProject,updateBoundSchoolImage,schoolText,connectSymbolText,splitCoverYear,coverYearText,monthText,renderPlanLines,schoolContactItems,schoolContactsText,renderSchoolContacts});
})(globalThis);

