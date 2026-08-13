import fs from 'node:fs';
const html=fs.readFileSync(new URL('../apps/designer-studio/index.html', import.meta.url),'utf8');
const start=html.lastIndexOf('startElementPointer=function(e)');
const move=html.indexOf('moveElementPointer=function(e)', start);
if(start<0||move<0) throw new Error('Sprint 2 pointer handlers missing');
const body=html.slice(start,move);
if(body.includes('render();')) throw new Error('Regression: render() destroys pointer capture during pointerdown');
if(!body.includes("setPointerCapture(e.pointerId)")) throw new Error('Pointer capture missing');
if(!html.includes('box.style.transform=`rotate(${view.rotation||0}deg)`')) throw new Error('Rotation persistence missing');
const syncStart=html.indexOf('const syncPrimary=()=>');
const syncEnd=html.indexOf('const setPrimary=',syncStart);
if(syncStart<0||syncEnd<0) throw new Error('Selection synchronization missing');
const syncBody=html.slice(syncStart,syncEnd);
if(!syncBody.includes('if(!selection.has(primaryKey)){selection.clear();selection.add(primaryKey)}')) {
  throw new Error('Regression: changing the primary element must replace stale selection');
}
if(!syncBody.includes('if(!getItem(id,scope))selection.delete(selectedKey)')) {
  throw new Error('Regression: stale selection entries must be removed');
}
console.log('Sprint 2 product interaction regression checks: PASS');
