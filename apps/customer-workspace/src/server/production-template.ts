import {createHash} from 'node:crypto';
import {assertNativeProject,type NativeProject} from '../lib/materials/native-project.ts';

const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const packageId=/^[a-z0-9][a-z0-9-]*$/;
const semver=/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const sha256=/^[a-f0-9]{64}$/i;

export async function loadProductionTemplate(
 config:{url:string;key:string;fetcher?:typeof fetch},
 templateId:string,
 editorRevision:number,
){
 if(!uuid.test(templateId)||!Number.isSafeInteger(editorRevision)||editorRevision<1)throw Error('템플릿 버전을 확인해 주세요.');
 const {key,fetcher=fetch}=config;
 const base=new URL(config.url);
 if(base.protocol!=='https:'||!key)throw Error('제작 검수 연결을 확인해 주세요.');
 async function read(path:string){
  const response=await fetcher(new URL(path,base),{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('제작 검수용 템플릿을 읽지 못했습니다.');
  return response;
 }
 const versions=await (await read(`/rest/v1/template_versions?select=project_data&template_id=eq.${templateId}&version_number=eq.${editorRevision}&limit=2`)).json();
 if(versions.length!==1)throw Error('편집에 사용한 템플릿 버전을 찾지 못했습니다.');
 const publishing=versions[0].project_data?.template?.publishing;
 const candidates=[publishing?.lastPrintInspectionPackage,publishing?.lastReviewPackage].filter(identity=>
  identity?.sourceEditorRevision===editorRevision&&packageId.test(identity.templateId)&&semver.test(identity.version)&&sha256.test(identity.sha256));
 for(const identity of candidates){
  const rows=await (await read(`/rest/v1/template_packages?select=package_storage_path,package_sha256&template_id=eq.${identity.templateId}&version=eq.${identity.version}&limit=1`)).json();
  const row=rows[0];
  const path=row?.package_storage_path;
  if(row?.package_sha256!==identity.sha256||typeof path!=='string'||!path.startsWith(`${identity.templateId}/${identity.version}/`)||path.split('/').some(segment=>!segment||segment==='.'||segment==='..'))continue;
  const bytes=Buffer.from(await (await read('/storage/v1/object/template-packages/'+path.split('/').map(encodeURIComponent).join('/'))).arrayBuffer());
  if(createHash('sha256').update(bytes).digest('hex')!==identity.sha256)throw Error('제작 검수용 템플릿 원본이 저장 기록과 일치하지 않습니다.');
  const bundle=JSON.parse(bytes.toString('utf8')) as NativeProject;
  const manifest=bundle.manifest;
  if(manifest?.templateId!==identity.templateId||manifest?.version!==identity.version||manifest?.sourceEditorRevision!==editorRevision||bundle.template?.kind!=='designer-project-snapshot')throw Error('인쇄용 패키지의 편집 버전이 일치하지 않습니다.');
  assertNativeProject(bundle.template.projectData);
  return {templateId:identity.templateId as string,version:identity.version as string,sha256:identity.sha256 as string,bundle};
 }
 throw Error('편집에 사용한 버전에 연결된 인쇄용 패키지가 없습니다.');
}
