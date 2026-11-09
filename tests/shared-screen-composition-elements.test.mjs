import test from 'node:test';
import assert from 'node:assert/strict';
import '../apps/designer-studio/shared-screen-composition.js';
const composition = globalThis.ACDLSharedScreenComposition;
test('authored backgrounds suppress the legacy cover panel before preview removal for PDF printing', () => {
 for(const role of ['graphic-package-background','graphic-library-background','ai-design-background','background-decoration']){
  assert.equal(composition.hasAuthoredBackground([{role}]),true);
  for(const disabled of [{hidden:true},{visible:false},{printable:false},{opacity:0}])assert.equal(composition.hasAuthoredBackground([{role,...disabled}]),false);
 }
 assert.equal(composition.hasAuthoredBackground([{role:'school-logo'}]),false);
 assert.equal(composition.hasAuthoredBackground([]),false);
});

test('master shadow, neutral background, and generated back composition use the same visibility and layer order', () => {
  const page = { aiDesignBase: { mode: 'neutral' }, aiMonthBackComposition: { mode: 'generated-layout' } };
  const masters = [
    { id: 'backdrop', role: 'background-decoration', zIndex: 0 },
    { id: 'memo', type: 'memo', zIndex: 1 },
    { id: 'hidden', type: 'text', zIndex: 2 },
    { id: 'kept', type: 'text', zIndex: 5 },
  ];
  const locals = [{ id: 'replacement', shadowOfMasterElementId: 'hidden', zIndex: 3 }];
  assert.deepEqual(composition.visibleElements(page, masters, locals).map(e => [e.id, e._scope]), [
    ['replacement', 'page'], ['kept', 'master'],
  ]);
});

test('authored frames survive conversions across page sizes and preserve deliberate bleed', () => {
  for (const size of [{ width: 260, height: 180 }, { width: 320, height: 120 }, { width: 420, height: 594 }]) {
    const authored = { x: -5, y: 12, width: 110, height: 79 };
    assert.deepEqual(composition.frameToPercent(composition.frameFromPercent(authored, size), size), authored);
  }
});


test('explicitly hidden local and master objects never render; hidden overrides still shadow masters',()=>{
 const masters=[{id:'logo',visible:true},{id:'hidden-master',visible:false},{id:'legacy-hidden',hidden:true},{id:'keep',zIndex:2}];
 const locals=[{id:'override',shadowOfMasterElementId:'logo',visible:false},{id:'hidden-local',visible:false},{id:'shown',zIndex:1}];
 assert.deepEqual(composition.visibleElements({},masters,locals).map(e=>e.id),['shown','keep']);
});
