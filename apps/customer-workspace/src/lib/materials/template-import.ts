import {assertNativeProject,fieldsForProject,photoSlotsForProject,type NativeProject} from './native-project.ts';
import type {TemplateCard} from '../api/contracts';
// Import is local-only. It never publishes a draft or modifies the designer's original.
export async function importTemplate(file:File):Promise<{template:TemplateCard;project:NativeProject}>{
 if(!/\.(?:acdl|json)$/i.test(file.name)||!file.size||file.size>30*1024*1024)throw Error('에디터에서 저장한 30MB 이하의 .acdl.json 원본을 선택해 주세요.');
 let project:NativeProject;try{project=JSON.parse(await file.text());assertNativeProject(project);}catch{throw Error('사용할 수 있는 템플릿 원본이 아니에요. PDF나 이미지 대신 에디터의 원본 파일을 선택해 주세요.');}
 const serialized=JSON.stringify(project);if(/acdl-asset:\/\//i.test(serialized))throw Error('이 원본은 서버 자산 참조를 포함하고 있어요. 이 파일의 이미지를 불러오려면 게시 템플릿 조회 연결이 필요해요.');
 if(/blob:/i.test(serialized))throw Error('임시 이미지 주소가 있는 원본이에요. 에디터에서 원본을 다시 저장해 주세요.');
 const p=project,year=Number(p.settings.year),start=Number(p.settings.startMonth||1),name=String(p.template.metadata?.name||p.book.name||file.name.replace(/\.(?:acdl\.)?json$/i,'')),pages=p.book.pageInstances;
 if(!Number.isInteger(year)||!Number.isInteger(start)||start<1||start>12)throw Error('템플릿의 달력 기간을 확인해 주세요.');
 const revision=Number(p.template.remoteVersionNumber||p.template.revision||1);
 const template:TemplateCard={id:'import-'+crypto.randomUUID(),version:Number.isInteger(revision)&&revision>0?revision:1,name:name.slice(0,120),description:'에디터에서 저장한 템플릿 원본',note:'이 브라우저에서 사용하는 원본입니다. 게시 상태를 변경하지 않아요.',previewKind:'imported',coverUrl:null,representativePages:[1],pageCount:pages.length,widthMm:Number(p.productType.pageSize.width),heightMm:Number(p.productType.pageSize.height),period:`${year}년 ${start}월부터`,pages:pages.map((page:NativeProject,i:number)=>({number:i+1,label:page.label||(page.calendarMonth?`${page.calendarMonth}월`:`달력 ${i+1}면`),imageUrl:null})),composition:[{label:'전체',count:pages.length}],fields:fieldsForProject(p),photoSlots:photoSlotsForProject(p),photoGuide:'원본에서 교체를 허용한 사진 영역에 사진을 배정해 주세요.'};
 return {template,project};
}
