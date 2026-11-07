import assert from 'node:assert/strict';
import test from 'node:test';
await import('../apps/designer-studio/ai-design/design-type-catalog@0.3.0.js');
await import('../apps/designer-studio/ai-design/design-spec@0.3.0.js');
const api=globalThis.ACDLDesignSpec;
test('page settings reflect actual cover and back-cover objects without mutating saved defaults',()=>{
 const project={template:{settings:{aiDesignSpec:{pageSettings:{roleCompositions:{cover:{components:['year','school-building','school-logo','school-name','school-slogan']}}}}}},book:{pageInstances:[{id:'front',role:'cover-front'},{id:'back',role:'back-cover-back'},{id:'month',role:'monthly-front'}],elementsByPage:{front:[{role:'year',binding:'calendar.year'},{role:'school-building',image:{binding:'school.profile.building'}},{role:'school-logo',binding:'school.profile.logo'},{role:'school-english-name',binding:'school.englishName'},{role:'school-slogan',binding:'school.slogan'}],back:[{role:'school-contact',binding:'school.website'}],month:[{role:'school-logo',binding:'school.profile.logo'}]}}};
 const before=JSON.stringify(project),spec=api.readPageSettings(project);
 assert.deepEqual(spec.pageSettings.roleCompositions.cover.components,['year','school-building','school-logo','school-english-name','school-slogan']);
 assert.deepEqual(spec.pageSettings.roleCompositions['back-cover-back'].components,['school-website']);
 assert.deepEqual(spec.pageSettings.roleCompositions.month.components,[]);
 assert.equal(JSON.stringify(project),before);
});
test('uninstantiated roles retain the saved settings',()=>{
 const project={template:{settings:{aiDesignSpec:{pageSettings:{roleCompositions:{cover:{components:['school-name']}}}}}},book:{pageInstances:[],elementsByPage:{}}};
 assert.deepEqual(api.readPageSettings(project).pageSettings.roleCompositions.cover.components,['school-name']);
});
