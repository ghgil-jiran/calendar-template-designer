import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Read-only inventory; no conversion, remote requests, asset resolution or writes.
export function inspectLegacy(source) {
  const pages=source?.book?.pageInstances || source?.book?.pages;
  const elements=source?.book?.elementsByPage;
  if(!Array.isArray(pages)||!elements||typeof elements!=='object') throw new Error('Unsupported legacy document shape');
  const ids=new Set(),issues=[],roles={};
  const summaries=pages.map(page=>{
    if(!page.id||ids.has(page.id))issues.push({code:'invalid-page-id'});
    ids.add(page.id);roles[page.role||'unknown']=(roles[page.role||'unknown']||0)+1;
    const list=elements[page.id]||[],seen=new Set();
    if(!Array.isArray(list))throw new Error('Invalid page elements');
    const counts={objects:0,connected:0,hidden:0,backgrounds:0},types={};
    for(const item of list){
      if(!item.id||seen.has(item.id))issues.push({code:'invalid-object-id',pageId:page.id});seen.add(item.id);
      counts.objects++;types[item.type||'unknown']=(types[item.type||'unknown']||0)+1;
      if(item.visible===false)counts.hidden++;
      if(item.bindingEnabled!==false&&(item.binding||item.image?.binding))counts.connected++;
      if(item.role==='graphic-package-background'||item.graphicSource?.pdfSource)counts.backgrounds++;
    }
    return {pageId:page.id,role:page.role||'unknown',...counts,types};
  });
  for(const key of Object.keys(elements))if(!ids.has(key))issues.push({code:'orphan-element-array',pageId:key});
  return {status:'inventory-only-not-migrated',pageCount:pages.length,roles,pages:summaries,issues,
    limitations:['Master expansion and runtime-generated objects are not counted','Binding counts are explicit declarations, not resolved behavior','No visual, asset or print validation']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(!process.argv[2])throw new Error('Usage: node platform-v2/inspect-legacy.mjs DOCUMENT.json');
  console.log(JSON.stringify(inspectLegacy(JSON.parse(await readFile(process.argv[2],'utf8'))),null,2));
}
