import {createHash} from 'node:crypto';
import {inspectLegacy} from './inspect-legacy.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const escapePointer=value=>String(value).replaceAll('~','~0').replaceAll('/','~1');
const kinds=new Set(['text','image','image-frame','shape','vector','semantic-object','year-calendar','month-date-strip','mini-calendar','mini-calendar-prev','mini-calendar-next','monthly-schedule','monthly-quote','event-list','memo','calendar','calendar-grid']);

function objectPlan(item,pointer,scope){
  const background=item.role==='graphic-package-background'||item.role==='background-decoration'||Boolean(item.graphicSource?.pdfSource);
  return {
    sourcePointer:pointer,sourceId:item.id||null,sourceType:item.type||null,scope,
    disposition:background?'separate-background':kinds.has(item.type)?'preserve-and-review':'unmapped',
    explicitBinding:item.bindingEnabled===false?null:item.binding||item.image?.binding||null,
    // Do not invent new role identifiers from legacy IDs or flatten authored overrides.
    role:item.role||null,
    styleKeys:Object.keys(item.style||{}).sort(),
    geometryKeys:['x','y','width','height','rotation','zIndex'].filter(key=>Object.hasOwn(item,key)),
    permissionKeys:Object.keys(item.permissions||{}).sort(),
    requiresRoleReview:!item.role&&!background
  };
}

export function createMigrationCandidate(source,{sourceKind,templateId,versionId}={}){
  if(!['saved-project','review-export'].includes(sourceKind))throw new Error('Explicit source kind required');
  if(!templateId||!versionId)throw new Error('Pinned source template and version required');
  if(sourceKind==='saved-project'&&source?.format!=='acdl-project')throw new Error('A saved project is required, not a diagnostic export');
  const snapshot=structuredClone(source),inventory=inspectLegacy(snapshot),issues=[...inventory.issues];
  const pageKey=Array.isArray(snapshot.book.pageInstances)?'pageInstances':'pages';
  if(sourceKind==='review-export')issues.push({code:'diagnostic-source-not-publishable'});
  if(snapshot.template?.masters&&Object.keys(snapshot.template.masters).length)issues.push({code:'master-runtime-expansion-review-required'});
  const masters=[];
  for(const [id,items] of Object.entries(snapshot.template?.masterElements||{})){
    if(!Array.isArray(items))throw new Error('Invalid master elements');
    const seen=new Set();
    const objects=items.map((item,index)=>{
      if(!item.id||seen.has(item.id))issues.push({code:'invalid-master-object-id',masterId:id});seen.add(item.id);
      return objectPlan(item,`/template/masterElements/${escapePointer(id)}/${index}`,'master');
    });
    masters.push({sourceId:id,objects});
  }
  const pages=snapshot.book[pageKey].map((page,index)=>({
    sourceId:page.id,sourcePointer:`/book/${pageKey}/${index}`,role:page.role||null,
    masterId:page.masterId||null,
    monthContext:{year:page.calendarYear??null,month:page.calendarMonth??null},
    // A shared role is not evidence that per-page positions or styles are identical.
    composition:{status:'legacy-custom-unregistered',styleBundleId:null},
    objects:(snapshot.book.elementsByPage[page.id]||[]).map((item,i)=>objectPlan(item,`/book/elementsByPage/${escapePointer(page.id)}/${i}`,'page'))
  }));
  const objects=[...masters.flatMap(m=>m.objects),...pages.flatMap(p=>p.objects)];
  for(const object of objects)if(object.disposition==='unmapped')issues.push({code:'unknown-object-type',sourcePointer:object.sourcePointer});
  return {
    format:'acdl-v2-migration-candidate',candidateVersion:1,state:'review-required',
    executable:false,publishable:false,
    source:{kind:sourceKind,templateId,versionId,sha256:hash(snapshot)},
    legacySnapshot:snapshot,
    plan:{pages,masters,issues,summary:{pages:pages.length,objects:objects.length,backgrounds:objects.filter(o=>o.disposition==='separate-background').length,unmapped:objects.filter(o=>o.disposition==='unmapped').length}},
    limitations:['Legacy snapshot is retained without normalization','No asset bytes are backed up','Implicit widgets require runtime expansion review','No final V2 document or executable renderer output is produced']
  };
}

export function assertCandidateUnchanged(candidate){
  if(candidate?.format!=='acdl-v2-migration-candidate'||hash(candidate.legacySnapshot)!==candidate.source?.sha256)throw new Error('Migration source snapshot changed');
  return true;
}

export function assertExecutableDocument(document){
  if(document?.format==='acdl-v2-migration-candidate')throw new Error('Migration candidates cannot be rendered, published or printed');
  // No executable V2 document contract has been enabled yet.
  throw new Error('V2 executable document contract is not enabled');
}
