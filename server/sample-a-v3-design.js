import {createHash} from 'node:crypto';
import {getTemplate,saveVersion} from './template-persistence.js';
export const TARGET='43205e86-a694-4f5f-9ae6-60d2ff45e915',BASE='9868c607-2c9f-4b21-90db-ff2f54bc0faf',REVISION='sample-a-v3-design-feedback-20261116-v1';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const fail=s=>{throw Object.assign(Error(s),{statusCode:409})};
export function protectedContent(p){return {pages:p.book.pageInstances,school:p.book.school,events:p.book.events,backgrounds:Object.fromEntries(Object.entries(p.book.elementsByPage).map(([k,v])=>[k,v.filter(e=>e.graphicSource?.pdfSource||e.role==='graphic-package-background')])),package:p.template.settings?.graphicPackage,masters:p.template.masterElements,product:p.productType};}
export function reviseSampleA(source){
 const p=structuredClone(source),elements=p.book?.elementsByPage;if(p.book?.pageInstances?.length!==28||!elements)fail('28면 원본 구성이 아닙니다.');
 const e=id=>{const found=Object.values(elements).flat().filter(x=>x.id===id);if(found.length!==1)fail('수정 개체 확인 필요: '+id);return found[0]};
 const style=(id,values)=>Object.assign(e(id).style,values),pt=(item,n)=>n*25.4/72*(Number(item.style?.fontReferenceWidthPx)||850)/260;
 const before=hash(protectedContent(p));let fonts=0;
 for(const page of p.book.pageInstances){if(page.role==='monthly-front'||page.role==='monthly-back')continue;for(const item of elements[page.id]||[]){if(item.type==='text'){item.style.fontFamily='Jua';item.style.fontWeight=400;fonts++;}}}
 const cap=e('surface.1.front.a.cover.caption.year'),caption=e('surface.1.front.a.cover.caption.label');Object.assign(cap,{x:30,width:40,format:'year-calendar-single-space',content:'2027 CALENDAR'});Object.assign(cap.style,{fontSize:21,textAlign:'center',whiteSpace:'nowrap'});caption.visible=false;
 const slogan=e('surface.1.front.a.cover.slogan.background');slogan.style.cornerRadiusMm=slogan.height/100*180/2;
 const motto=e('surface.2.front.refined.motto-panel');motto.style.cornerRadiusMm=3;
 for(const key of ['tree','flower']){const label=e(`surface.2.front.a.${key}.name`),accent=e(`surface.2.front.refined.${key}-name`);accent.visible=false;Object.assign(label.style,{textDecoration:'underline',textDecorationColor:accent.style.fill,textDecorationThickness:3,textUnderlineOffset:2});}
 const coverLogo=e('surface.1.front.a.cover.logo'),coverName=e('surface.1.front.a.cover.logo.name'),coverEnglish=e('surface.1.front.a.cover.logo.english');coverLogo.y=94-coverLogo.height/2;coverName.y=90.8;coverName.style.verticalAlign='middle';coverEnglish.y=94;coverEnglish.style.verticalAlign='middle';
 const address=e('surface.1.front.a.cover.address'),contacts=e('surface.1.front.a.cover.contacts'),web=e('surface.1.front.a.cover.website');address.style.fontSize*=1.5;address.y=90.5;address.height=3.5;contacts.y=address.y+2.4-(25.4/72/180*100);contacts.height=4;contacts.width=44;web.x=82;web.width=14;web.y=contacts.y;
 const annual=e('surface.1.back.a.annual.heading');annual.style.fontSize+=pt(annual,2);
 const month=p.template.masters.calendar.calendarLayout.monthTitle.style;month.yearSize+=2*25.4/72*850/260;month.englishSize+=2*25.4/72*850/260;
 const name=e('surface.14.back.a.back.logo.name'),english=e('surface.14.back.a.back.logo.english');for(const item of [name,english]){item.style.fontSize*=1.5;item.width*=1.5;item.height*=1.5;}name.x=42;english.x=42;name.y=42;english.y=49;
 e('surface.14.back.a.back.logo').x=31.5;
 for(const [key,y,h] of [['address',64,4],['contacts',69,5],['website',75,4]]){const item=e('surface.14.back.a.back.'+key);item.style.fontSize*=1.5;item.y=y;item.height=h;item.x=10;item.width=80;}
 for(const prefix of ['surface.1.front.a.cover.logo','surface.14.back.a.back.logo']){const parts=[e(prefix),e(prefix+'.name'),e(prefix+'.english')],x=Math.min(...parts.map(i=>i.x)),y=Math.min(...parts.map(i=>i.y));(e(prefix).metadata||={}).combinedFrame={x,y,width:Math.max(...parts.map(i=>i.x+i.width))-x,height:Math.max(...parts.map(i=>i.y+i.height))-y};}
 p.settings.calendarData={...p.settings.calendarData,includeHolidays:true,includeSolarTerms:false,includeAnniversaries:false};
 Object.assign(p.template.masters.calendar.rangeEventStyle,{fontSizePt:8.5,fontWeight:400,minimumFontSizePt:8.5,barHeight:20,laneGap:2});
 p.template.metadata={...p.template.metadata,designFeedbackRevision:REVISION,designFeedbackBaseVersionId:BASE};
 delete p.template.savedPagePreviews;delete p.template.thumbnail;
 if(hash(protectedContent(p))!==before)fail('페이지·배경·패키지·학교 자료가 달라 중단했습니다.');
 return {project:p,report:{textObjects:fonts,pageCount:28,backgroundsPreserved:true,packagePreserved:true,scheduleFontSizePt:8.5,changes:['표지 연도·CALENDAR 한 칸 간격','비월력 텍스트 주아체','슬로건·교훈 도형 실제 규격 기준 둥근 모서리','교표·학교명 중앙 배치와 주소 확대','연력 연도 +2pt','교목·교화 이름 강조선 문자 폭에 맞춤','월력 연도·영문 월명 +2pt','학사일정 8.5pt 및 초과 일정 표시','뒷표지 학교 정보 1.5배 확대']}};
}
export async function runSampleADesign(body,{load=getTemplate,save=saveVersion}={}){
 if(!['inspect','apply'].includes(body.operation))fail('작업 구분을 확인해 주세요.');const current=await load(TARGET),{template:t,version:v}=current;
 if(t.id!==TARGET||t.name!=='2027학년도 · 샘플 A · 패키지 연결 테스트'||t.state==='published')fail('지정된 검토용 템플릿이 아닙니다.');
 if(v.projectData.template.metadata?.designFeedbackRevision===REVISION)return {completed:true,version:v.versionNumber,templateId:TARGET};
 if(v.versionNumber!==3||v.id!==BASE)fail('v3 원본이 변경되었습니다. 최신 버전을 먼저 확인해 주세요.');const {project,report}=reviseSampleA(v.projectData),sourceHash=hash(v.projectData);
 if(body.operation==='inspect')return {completed:false,templateId:TARGET,version:3,versionId:v.id,sourceHash,report};
 if(body.versionId!==v.id||body.sourceHash!==sourceHash)fail('확인한 원본과 달라 저장하지 않았습니다.');const latest=await load(TARGET);if(latest.version.id!==v.id)fail('작업 중 새 버전이 저장되었습니다.');
 const result=await save({templateId:TARGET,stableKey:t.stableKey,name:t.name,description:t.description,edition:t.edition,state:'draft',isStandard:false,productType:t.productType,templateKey:t.templateKey,saveKind:'manual',sourceVersionId:v.id,schemaVersion:v.schemaVersion,saveNote:'v3 디자인 피드백 반영 · 원본 PDF·패키지 연결 보존 · 재인쇄 검증 필요',projectData:project});
 const reopened=await load(TARGET);if(reopened.version.id!==result.version.id||hash(protectedContent(reopened.version.projectData))!==hash(protectedContent(v.projectData)))fail('저장 후 원본 연결 재확인이 필요합니다.');
 return {completed:true,templateId:TARGET,version:reopened.version.versionNumber,report,reopenedVerified:true};
}
