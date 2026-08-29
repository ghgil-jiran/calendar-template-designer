import fs from 'node:fs';
const readSource = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const html=readSource('../apps/designer-studio/index.html');
const selectionModule=readSource('../apps/designer-studio/canvas-selection.js');
const inputModule=readSource('../apps/designer-studio/canvas-input.js');
const start=html.lastIndexOf('startElementPointer=function(e)');
const move=html.indexOf('moveElementPointer=function(e)', start);
if(start<0||move<0) throw new Error('Sprint 2 pointer handlers missing');
const body=html.slice(start,move);
if(body.includes('render();')) throw new Error('Regression: render() destroys pointer capture during pointerdown');
if(!body.includes('ACDLCanvasInput.capturePointer(')||!inputModule.includes('node.setPointerCapture(pointerId)')) throw new Error('Pointer capture missing');
if(!html.includes('box.style.transform=`rotate(${view.rotation||0}deg)`')) throw new Error('Rotation persistence missing');
const syncStart=html.indexOf('const syncPrimary=()=>');
const syncEnd=html.indexOf('const setPrimary=',syncStart);
if(syncStart<0||syncEnd<0) throw new Error('Selection synchronization missing');
const syncBody=html.slice(syncStart,syncEnd);
if(!syncBody.includes('selection.sync(')||!selectionModule.includes("if (!selected.has(primaryKey)) {")||!selectionModule.includes('selected.clear();\n        selected.add(primaryKey);')) {
  throw new Error('Regression: changing the primary element must replace stale selection');
}
if(!selectionModule.includes('if (!resolveItem(id, scope)) selected.delete(value);')) {
  throw new Error('Regression: stale selection entries must be removed');
}
console.log('Sprint 2 product interaction regression checks: PASS');
