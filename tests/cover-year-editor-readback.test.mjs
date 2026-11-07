import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const source=fs.readFileSync(new URL('../apps/designer-studio/features/template-settings-workspace-runtime.js',import.meta.url),'utf8');
const snippet=source.slice(source.indexOf(' const oldResolve=window.resolveTextContent||resolveTextContent;'),source.indexOf(' // Make text color authoritative'));
test('late workspace binding resolver preserves the saved cover year display',()=>{
 const page={role:'cover-front',calendarYear:2027};
 const project={settings:{year:2027},template:{settings:{aiDesignSpec:{pageSettings:{roleCompositions:{cover:{yearFormat:'number-calendar',yearLines:'two'}}}}}}};
 const context={window:{},project,selectedPage:()=>page,resolveTextContent:(item)=>item.binding==='calendar.year'?'2027\nCALENDAR':''};
 vm.runInNewContext(snippet,context);
 assert.equal(context.resolveTextContent({binding:'calendar.year',format:'year-plain'},page),'2027\nCALENDAR');
 assert.equal(context.resolveTextContent({binding:'calendar.year',format:'year-ko'},{role:'monthly-front',calendarYear:2027}),'2027년');
});
