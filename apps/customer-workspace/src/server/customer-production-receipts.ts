import {createHash,createHmac} from 'node:crypto';
import {createOriginalStorage} from './customer-originals.ts';
import {createPublishedReader} from './published-reader.ts';
import {applyMaterials,fieldsForProject} from '../lib/materials/native-project.ts';
import {applyEditor} from '../lib/editor/session.ts';
import type {ProjectRecord} from '../lib/projects/store.ts';
import type {OriginalEntry} from '../lib/projects/originals.ts';

const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const sha=/^[a-f0-9]{64}$/;
const hex=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const receiptTable='/rest/v1/calendar_production_requests';
const bucket='/storage/v1/object/calendar-production-assets';
type Submission=Pick<ProjectRecord,'id'|'name'|'school'|'events'|'assignments'|'editorState'|'bindingVersion'> & {
 templateId:string;templateVersion:number;photos:{id:string;name:string;sha256:string}[];
};

export async function submitProductionReceipt(config:{url:string;key:string;fetcher?:typeof fetch},accessKey:string,input:Submission){
 const {url,key,fetcher=fetch}=config;
 if(!sha.test(accessKey)||!input||!uuid.test(input.id)||typeof input.name!=='string'||!input.name.trim()||input.name.length>120||
 !Array.isArray(input.photos)||input.photos.length>50||!Array.isArray(input.events)||input.events.length>2000||
 !input.school?.values||!Array.isArray(input.school.hidden)||!input.assignments||![undefined,2,3,4,5].includes(input.bindingVersion))throw Error('저장한 프로젝트 정보를 확인해 주세요.');
 if(Object.values(input.school.values).some(value=>typeof value!=='string'||value.length>10000)||
 input.photos.some(photo=>!photo||!uuid.test(photo.id)||!sha.test(photo.sha256)||typeof photo.name!=='string'||photo.name.length>255)||
 new Set(input.photos.map(photo=>photo.id)).size!==input.photos.length)throw Error('학교 정보와 사진 원본을 확인해 주세요.');

 const source=await createPublishedReader(config).receiptSource(input.templateId,input.templateVersion);
 const assets=input.photos.map(photo=>({id:photo.id,url:`production-asset://${photo.sha256}`}));
 const assignments=Object.fromEntries(Object.entries(input.assignments).map(([slot,assignment])=>{
  const photo=assets.find(asset=>asset.id===assignment?.photoId);
  if(!photo)throw Error('배정한 사진 원본을 찾지 못했어요.');
  return [slot,{photoId:photo.id,url:photo.url}];
 }));
 const applied=applyMaterials(source,fieldsForProject(source),input.school,input.events,assignments,input.bindingVersion||2);
 const project=input.editorState?applyEditor(applied,input.editorState,assets):applied;
 const schoolName=project.book.school?.name||input.school.values.name||input.name;
 const doc={meta:{templateId:input.templateId,templateVersion:input.templateVersion}};
 const document={editorProject:project,template:{pages:project.book.pageInstances.map((page:{id:string;label?:string;role:string})=>({id:page.id,title:page.label,role:page.role}))}};
 const photos=[...new Map(input.photos.map(photo=>[photo.sha256,photo])).values()].sort((a,b)=>a.sha256.localeCompare(b.sha256));
 const fingerprint=hex(JSON.stringify({sourceId:input.id,name:input.name,doc,document,photos}));
 const digest=createHmac('sha256',key).update(accessKey).update(fingerprint).digest('hex');
 const id=`${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
 const base=url.replace(/\/$/,'');
 async function request(path:string,init:RequestInit={}){
  return fetcher(base+path,{...init,cache:'no-store',signal:AbortSignal.timeout(30000),headers:{apikey:key,Authorization:`Bearer ${key}`,...init.headers}});
 }
 const lookup=async()=>{
  const response=await request(`${receiptTable}?id=eq.${id}&select=receipt_number&limit=1`);
  if(!response.ok)throw Error('접수 기록을 확인하지 못했어요.');
  return (await response.json())[0]?.receipt_number;
 };
 const result=(number:unknown)=>{
  if(typeof number!=='number'&&typeof number!=='string'||!/^\d+$/.test(String(number)))throw Error('발급된 접수번호를 확인하지 못했어요. 다시 시도해 주세요.');
  return {receiptNumber:`CAL-${String(number).padStart(6,'0')}`};
 };
 const existing=await lookup();
 if(existing)return result(existing);
 const storage=createOriginalStorage(config);
 const originals:(OriginalEntry&{id:string;name:string;path:string})[]=[];
 for(const photo of photos){
  const {bytes,mimeType}=await storage.read(accessKey,photo.sha256);
  const path=`guest/${id}/${photo.sha256}`;
  const response=await request(`${bucket}/${path}`,{method:'POST',headers:{'Content-Type':mimeType,'x-upsert':'false'},body:new Uint8Array(bytes)});
  if(!response.ok){
   const prior=await request(`${bucket}/${path}`);
   if(!prior.ok||hex(new Uint8Array(await prior.arrayBuffer()))!==photo.sha256)throw Error('접수용 사진 원본을 보관하지 못했어요.');
  }
  originals.push({id:photo.sha256,name:photo.name,path,mimeType,sha256:photo.sha256,byteSize:bytes.length});
 }
 const snapshot={schemaVersion:'customer-production-receipt.v1',name:input.name,doc,document,assets:originals};
 const created=await request(receiptTable+'?on_conflict=id&select=receipt_number',{
  method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation'},
  body:JSON.stringify({id,owner_id:null,source_document_id:input.id,school_name:String(schoolName).slice(0,120),contact:{},snapshot,snapshot_hash:hex(JSON.stringify(snapshot))}),
 });
 if(!created.ok)throw Error('제작 검수 접수를 저장하지 못했어요.');
 return result((await created.json())[0]?.receipt_number||await lookup());
}
