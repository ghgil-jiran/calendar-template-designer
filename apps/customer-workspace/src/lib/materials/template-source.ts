import type {TemplateCard} from '../api/contracts';
import {assertNativeProject,type NativeProject} from './native-project.ts';
const cache=new Map<string,{time:number;promise:Promise<NativeProject>}>();
export function fetchTemplateSource(template:TemplateCard):Promise<NativeProject>{
 if(!template.sourceUrl)return Promise.reject(Error('템플릿 원본 주소가 없어요.'));
 const key=`${template.id}:${template.version}:${template.sourceUrl}`,entry=cache.get(key);if(entry&&Date.now()-entry.time<10*60*1000)return entry.promise;
 const promise=(async()=>{const r=await fetch(template.sourceUrl!,{signal:AbortSignal.timeout(30000)}),body=await r.json();if(!r.ok)throw Error(body.error||'템플릿을 불러오지 못했어요.');if(body.templateId!==template.id||body.version!==template.version)throw Error('템플릿 버전이 다릅니다. 목록을 다시 열어 주세요.');assertNativeProject(body.project);return body.project;})().catch(error=>{cache.delete(key);throw error;});
 if(cache.size>=6)cache.delete(cache.keys().next().value!);cache.set(key,{time:Date.now(),promise});return promise;
}
