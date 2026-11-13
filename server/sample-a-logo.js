import {readFile} from 'node:fs/promises';
import {getTemplate,saveVersion,storeTemplateAsset} from './template-persistence.js';
export const SAMPLE_A_ID='5c3eee14-3b66-4990-894d-d95d56d6d0f3';
export const SAMPLE_IDS={A:SAMPLE_A_ID,B:'00ccd75a-3223-40dc-a942-480913e5394b',C:'cd82064c-12e3-4be4-973b-352327f6568b',D:'8fab8b4c-6164-42cc-8cb8-9cff61ca39d0'};
export const LOGO_REVISION='sample-a-split-logo-v1';
const rights={move:true,resize:true,content:true,color:true,delete:true,duplicate:true,replaceImage:true,imageFit:true};
export function splitSampleLogo(source,image,templateId=SAMPLE_A_ID){
 const revision=templateId===SAMPLE_A_ID?LOGO_REVISION:'school-identity-split-v1';
 const p=structuredClone(source);if(p.template.metadata?.schoolLogoRevision===revision)return p;
 if(!Object.values(SAMPLE_IDS).includes(templateId)||(p.template.remoteId||p.template.id)!==templateId)throw Error('지정한 샘플 원본만 수정할 수 있습니다.');
 const pages=p.book.pageInstances,selected=pages.filter(page=>['cover-front','monthly-front','back-cover-front','back-cover-back'].includes(page.role));
 if(pages.length!==28||selected.filter(page=>page.role==='monthly-front').length!==12)throw Error('샘플 페이지 구성을 확인해 주세요.');
 const processed=new WeakSet();
 for(const page of selected){
  const isLogo=e=>e.role==='school-logo'||e.image?.binding==='school.profile.logo'||e.binding==='school.profile.logo';
  const local=p.book.elementsByPage[page.id]||=[],master=p.template.masterElements?.[page.masterId]||[];
  const items=local.some(isLogo)?local:master.some(isLogo)?master:local;
  if(processed.has(items))continue;processed.add(items);
  const logo=items.find(isLogo);
  if(!logo&&page.role!=='monthly-front')continue;
  const frame=logo?{x:logo.x,y:logo.y,width:logo.width,height:logo.height}:{x:77,y:8.7,width:18,height:8};
  const id=logo?.id||page.id+'.school-logo',h=frame.height*.84,w=h*p.productType.pageSize.height/p.productType.pageSize.width,gap=frame.width*.045,textX=frame.x+w+gap,textW=frame.width-w-gap;
  const metadata={logoGroupId:'school-identity',logoPart:'image',combinedFrame:frame};
  const img={...(logo||{}),id,type:'image-frame',role:'school-logo',x:frame.x,y:frame.y+(frame.height-h)/2,width:w,height:h,zIndex:logo?.zIndex||10,fit:'contain',frameType:'rect',image:{src:image,binding:'school.profile.logo',fit:'contain',scale:1,offsetX:0,offsetY:0},style:{...logo?.style,strokeWidth:logo?.style?.strokeWidth??0,background:logo?.style?.background??false},permissions:{...rights},userReplaceable:true,visible:true,metadata:{...logo?.metadata,...metadata}};
  const text=(part,binding,y,height,fontSize)=>({id:id+'.'+part,type:'text',role:part==='name'?'school-name':'school-english-name',binding,content:part==='name'?p.book.school.name:p.book.school.englishName,x:textX,y,width:textW,height,zIndex:img.zIndex+1,visible:true,style:{fontFamily:'Pretendard',fontSize,fontReferenceWidthPx:260*96/25.4,fontWeight:part==='name'?700:400,textAlign:'left',verticalAlign:'center',padding:0,lineHeight:1.1,color:'#17202e'},permissions:{...rights,replaceImage:false,imageFit:false},metadata:{logoGroupId:'school-identity',logoPart:part}});
  const size=page.role==='monthly-front'?10.5:frame.width>25?21:13;
  const newItems=[img,text('name','school.name',frame.y+frame.height*.14,frame.height*.4,size),text('english','school.englishName',frame.y+frame.height*.55,frame.height*.28,size*.48)];
  if(logo)items.splice(items.indexOf(logo),1,...newItems);else items.push(...newItems);
 }
 p.book.school.profile.logo={...p.book.school.profile.logo,image};
 p.template.metadata={...p.template.metadata,schoolLogoRevision:revision};
 // New output must be regenerated rather than reusing images or print certification of the previous layout.
 delete p.template.savedPagePreviews;delete p.template.thumbnail;
 return p;
}
export const splitSampleALogo=splitSampleLogo;
export async function updateSampleLogo(body,{get=getTemplate,save=saveVersion,store=storeTemplateAsset}={}){
 const sample=body.sample,templateId=SAMPLE_IDS[sample];if(!templateId)throw Object.assign(Error('수정할 샘플을 선택해 주세요.'),{statusCode:400});
 const revision=sample==='A'?LOGO_REVISION:'school-identity-split-v1';
 const current=await get(templateId),v=current.version,t=current.template;
 if(v.projectData.template.metadata?.schoolLogoRevision===revision)return {completed:true,unchanged:true,templateId:t.id,version:v.versionNumber};
 if(body.operation==='inspect')return {completed:false,templateId:t.id,version:v.versionNumber,versionId:v.id,pages:14};
 if(body.operation!=='apply'||body.versionId!==v.id)throw Object.assign(Error('저장 내용이 변경되었습니다. 최신 상태를 확인한 뒤 다시 실행해 주세요.'),{statusCode:409});
 const bytes=await readFile(new URL('../assets/sample-c/school-logo.png',import.meta.url)),asset=await store('data:image/png;base64,'+bytes.toString('base64'));
 const project=splitSampleLogo(v.projectData,'acdl-asset://'+asset.id,templateId);
 const result=await save({templateId:t.id,stableKey:t.stableKey,name:t.name,description:t.description,edition:t.edition,state:t.state,isStandard:t.isStandard,productType:t.productType,templateKey:t.templateKey,saveKind:'manual',sourceVersionId:v.id,schemaVersion:v.schemaVersion,saveNote:`샘플 ${sample} 교표·학교명·영문명 분리 및 월력 12면 공통 구성`,projectData:project});
 return {completed:true,templateId:t.id,version:result.version.versionNumber,pages:14};
}

export function updateSampleALogo(body,deps){return updateSampleLogo({...body,sample:'A'},deps);}
