import {createPublishedReader} from '../src/server/published-reader.ts';
import {prepareSnapshot,backupFile,restoreBackup,hydrateSnapshot} from '../src/lib/projects/store.ts';
// Run inside the deployment: credentials stay in server environment, never in logs/artifacts.
const mode=process.env.CUSTOMER_CATALOG_MODE?.trim();
if(mode&&!['review','published'].includes(mode)){console.error('[published-check] invalid catalog mode');process.exit(1);}
if(mode!=='published'){console.log('[published-check] skipped: review mode');process.exit(0);}
try{
 const reader=createPublishedReader({url:process.env.SUPABASE_URL||'',key:process.env.SUPABASE_SERVICE_ROLE_KEY||''});
 const catalog=await reader.publishedCatalog();
 console.log('[published-check] '+JSON.stringify({stage:'catalog',mode:catalog.mode,publishedCount:catalog.templates.length}));
 if(!catalog.templates.length){console.log('[published-check] connected; no published templates available');process.exit(0);}
 const template=catalog.templates[0],source=(await reader.publishedSource(template.id,template.version)).project,before=JSON.stringify(source);
 const values=Object.fromEntries(template.fields.map(f=>[f.key,f.key==='name'?'연결 검사 학교':'']));
 const snapshot=await prepareSnapshot({name:'서버 연결 검사',template,source,school:{values,hidden:[]},events:[{id:'connection-check',title:'연결 검사 일정',startDate:`${source.settings.year}-03-02`,endDate:`${source.settings.year}-03-02`}],photos:[],assignments:{},step:'school'});
 if(JSON.stringify(source)!==before)throw Error('원본 변경 감지');
 const restored=hydrateSnapshot(await restoreBackup(new File([await backupFile(snapshot)],'connection.calendar-backup')));
 try{if(restored.appliedProject.book.school.name!=='연결 검사 학교'||!restored.appliedProject.book.events.some(e=>e.id==='connection-check'))throw Error('반영본 복원 실패');}
 finally{restored.urls.forEach(URL.revokeObjectURL)}
 console.log('[published-check] '+JSON.stringify({stage:'source-assets-materials-backup',status:'passed',templateId:template.id,version:template.version,pageCount:template.pageCount,imageCount:snapshot.files.length,imageBytes:snapshot.record.byteSize}));
}catch(error){console.error('[published-check] connection verification failed: '+(error instanceof Error?error.message:'unknown'));process.exit(1);}
