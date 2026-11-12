import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateVersionSave} from '../server/template-persistence.js';
const project=()=>({format:'acdl-project',version:'2.18.0',book:{id:'book',pageInstances:[],elementsByPage:{}},settings:{year:2027},template:{masters:{calendar:{calendarLayout:{gridAppearance:{dateColor:'#222222'}}}}}});
test('ordinary editor serialization writes default category colors without changing live project/layout',()=>{
 const ctx={};vm.createContext(ctx);for(const file of ['shared-screen-calendar-annotations.js','persistence-project.js'])vm.runInContext(fs.readFileSync(new URL('../apps/designer-studio/'+file,import.meta.url),'utf8'),ctx);
 const original=project(),saved=JSON.parse(ctx.ACDLPersistenceProject.serialize(original));
 assert.equal(saved.template.masters.calendar.calendarLayout.referenceColors.anniversaries.mode,'inherit');assert.equal(saved.template.masters.calendar.calendarLayout.annotations,undefined);assert.equal(original.template.masters.calendar.calendarLayout.referenceColors,undefined);
});
test('server version saves persist category choices and fill missing category defaults',()=>{
 const p=project();p.template.masters.calendar.calendarLayout.referenceColors={anniversaries:{mode:'custom',color:'#123456'}};
 const saved=validateVersionSave({stableKey:'test',name:'test',edition:2027,state:'draft',productType:'desk',templateKey:'test',saveKind:'manual',schemaVersion:'2.18.0',projectData:p});
 assert.equal(saved.projectData.template.masters.calendar.calendarLayout.referenceColors.anniversaries.color,'#123456');assert.equal(saved.projectData.template.masters.calendar.calendarLayout.referenceColors.lunars.mode,'inherit');
});
