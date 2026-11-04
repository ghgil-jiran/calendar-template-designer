import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={};runInNewContext(readFileSync(new URL('../apps/designer-studio/shared-page-object-model.js',import.meta.url),'utf8'),context);
const api=context.ACDLPageObjectModel,items=input=>JSON.parse(JSON.stringify(api.schoolContactItems(input)));
test('department phones precede a single fax even when the fax belongs to the first input row',()=>{
 const school={contacts:[{label:'교무실',phone:'031-111-1111',fax:'031-333-3333'},{label:'행정실',phone:'031-222-2222'}]};
 assert.equal(api.schoolContactsText(school),'교무실 031-111-1111 · 행정실 031-222-2222 · 팩스 031-333-3333');
});
test('department-specific faxes retain ownership after both phone numbers',()=>{
 const source=[{label:'행정실',phone:'A',fax:'AF'},{label:'교무실',phone:'T',fax:'TF'}],before=JSON.stringify(source);
 assert.deepEqual(items(source).map(x=>[x.label,x.value]),[['교무실','T'],['행정실','A'],['교무실 팩스','TF'],['행정실 팩스','AF']]);
 assert.equal(JSON.stringify(source),before);
});
test('service dataset contact types and legacy value rows keep Korean labels',()=>{
 assert.equal(api.schoolContactsText([{type:'fax',value:'F'},{type:'admin',value:'A'},{type:'academic',value:'T'}]),'교무실 T · 행정실 A · 팩스 F');
 assert.equal(api.schoolContactsText([{label:'교무실',value:'T'},{label:'팩스',value:'F'}]),'교무실 T · 팩스 F');
});
test('empty fields, fax-only departments and legacy school-level values are preserved safely',()=>{
 assert.equal(api.schoolContactsText({contacts:[null,{label:'교무실',phone:'  ',fax:''}]}),'');
 assert.equal(api.schoolContactsText({contacts:[],phone:'T',fax:'F'}),'교무실 T · 팩스 F');
 assert.equal(api.schoolContactsText([{label:'교무실',fax:'TF'},{label:'행정실',fax:'AF'}]),'교무실 팩스 TF · 행정실 팩스 AF');
});
test('responsive markup wraps complete contact pairs without fixed newlines or unsafe HTML',()=>{
 const html=api.renderSchoolContacts([{label:'교무실',phone:'T'},{label:'행정실',phone:'A',fax:'<img onerror="bad">'}]);
 assert.match(html,/flex-wrap:wrap/);assert.match(html,/width:100%/);assert.match(html,/justify-content:inherit/);
 assert.equal((html.match(/class="school-contact-item"/g)||[]).length,3);
 assert.equal((html.match(/display:inline-block;white-space:nowrap/g)||[]).length,3);
 assert.doesNotMatch(html,/<br|<img|onerror="bad"/);assert.match(html,/&lt;img/);
 assert.equal(api.renderSchoolContacts([]),'');
});
