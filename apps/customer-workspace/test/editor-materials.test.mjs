import test from 'node:test';
import assert from 'node:assert/strict';
import {commitMaterials,updateSchoolField} from '../src/lib/editor/materials.ts';
import {applyMaterials,fieldsForProject} from '../src/lib/materials/native-project.ts';
const school={values:{name:'원래 학교'},hidden:[]};
test('popup cancel/failure cannot leak draft values; persistence precedes committed state replacement',async()=>{
 let committed=structuredClone(school),events=[{id:'one',title:'원래 일정',startDate:'2027-03-03',endDate:'2027-03-03'}];const draft={school:updateSchoolField(school,'name','새 학교'),events:structuredClone(events)};draft.events[0].title='수정 일정';let apply=0;
 assert.equal(committed.values.name,'원래 학교');assert.equal(events[0].title,'원래 일정');
 assert.equal(await commitMaterials(draft,async()=>false,()=>apply++),false);assert.equal(apply,0);assert.equal(committed.values.name,'원래 학교');
 await assert.rejects(()=>commitMaterials(draft,async()=>{throw Error('저장 실패')},()=>apply++),/저장 실패/);assert.equal(apply,0);
 assert.equal(await commitMaterials(draft,async()=>{assert.equal(committed.values.name,'원래 학교');return true},v=>{committed=v.school;events=v.events;apply++}),true);assert.equal(apply,1);assert.equal(committed.values.name,'새 학교');assert.equal(events[0].title,'수정 일정');draft.school.values.name='다른 값';assert.equal(committed.values.name,'새 학교');
});
test('explicitly clearing linked text stays empty instead of falling back to the template sample',()=>{
 const source={format:'acdl-project',settings:{year:2027},productType:{pageSize:{width:260,height:180}},template:{masters:{},masterElements:{}},book:{school:{name:'샘플 학교'},events:[],pageInstances:[{id:'cover',role:'cover-front'}],elementsByPage:{cover:[{id:'name',type:'text',binding:'school.name'}]}}};const fields=fieldsForProject(source),cleared=updateSchoolField(school,'name','');
 assert.equal(applyMaterials(source,fields,cleared,[],{}).book.school.name,'');assert.equal(source.book.school.name,'샘플 학교');assert.equal(applyMaterials(source,fields,updateSchoolField(cleared,'name','새 학교'),[],{}).book.school.name,'새 학교');
});
test('hiding one contact preserves the remaining contact block and hiding all contacts removes it',()=>{
 const source={format:'acdl-project',settings:{year:2027},productType:{pageSize:{width:260,height:180}},template:{masters:{},masterElements:{}},book:{school:{name:'학교',contacts:[{label:'교무실',phone:'111',value:'111'},{label:'행정실',phone:'222',value:'222'}]},events:[],pageInstances:[{id:'cover',role:'cover-front'}],elementsByPage:{cover:[{id:'contacts',type:'text',binding:'school.contacts',bindingEnabled:true}]}}};
 const fields=fieldsForProject(source),one=applyMaterials(source,fields,{values:{},hidden:['contact-0-phone']},[],{});assert.equal(one.book.school.contacts[0].phone,'');assert.equal(one.book.school.contacts[0].value,'');assert.equal(one.book.school.contacts[1].phone,'222');assert.notEqual(one.book.elementsByPage.cover[0].visible,false);
 const all=applyMaterials(source,fields,{values:{},hidden:['contact-0-phone','contact-1-phone']},[],{});assert.equal(all.book.elementsByPage.cover[0].visible,false);assert.notEqual(applyMaterials(source,fields,{values:{},hidden:[]},[],{}).book.elementsByPage.cover[0].visible,false);
});
