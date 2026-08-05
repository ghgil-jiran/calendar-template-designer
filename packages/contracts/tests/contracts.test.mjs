import assert from"node:assert/strict";
import{SCHOOL_DATA_SCHEMA,assertCalendarDocument,normalizeSchoolData,validateSchoolData,normalizeAcademicYear,normalizeCalendarEvent,validateCalendarEvent,normalizeImageFrameValue,mergeMonthlyStyle}from"../dist/index.js";

const document={contractVersion:"1.0",id:"x",revision:1,pages:[]};
assert.doesNotThrow(()=>assertCalendarDocument(document));
assert.throws(()=>assertCalendarDocument({contractVersion:"0"}));

assert.equal(SCHOOL_DATA_SCHEMA.version,"2.0");
assert.equal(SCHOOL_DATA_SCHEMA.fields.find(field=>field.key==="school.name")?.required,true);

const school=normalizeSchoolData({
  name:"  지란지교테크고등학교  ",englishName:"JIRANTECH HIGH SCHOOL",phone:"02-0000-0000",fax:"02-0000-0001",
  profile:{building:{assetId:"asset.building",image:"building.jpg",name:"본관"},logo:{image:"logo.png"},motto:{description:"바르게 배우자"},flower:{name:"장미",description:"사랑"}}
});
assert.equal(school.name,"지란지교테크고등학교");
assert.equal(school.nameEn,"JIRANTECH HIGH SCHOOL");
assert.deepEqual(school.contacts,[{label:"대표",phone:"02-0000-0000",fax:"02-0000-0001"}]);
assert.equal(school.exterior?.assetId,"asset.building");
assert.equal(school.exterior?.src,"building.jpg");
assert.equal(school.logo?.src,"logo.png");
assert.equal(school.motto?.plainText,"바르게 배우자");
assert.equal(school.flower?.name,"장미");
assert.deepEqual(validateSchoolData(school),[]);
assert.deepEqual(validateSchoolData(normalizeSchoolData({website:"ftp://example.com"})),["school.name.required","school.website.invalid"]);
const academic=normalizeAcademicYear({year:2027,startMonth:3});
assert.deepEqual([academic.startDate,academic.endDate],["2027-03-01","2028-02-29"]);
assert.throws(()=>normalizeAcademicYear({year:2027,startMonth:13}));
const single=normalizeCalendarEvent({id:"e1",title:"입학식",start:"2027-03-02"});
const range=normalizeCalendarEvent({id:"e2",name:"여름방학",start:"2027-07-20",end:"2027-08-15"});
assert.equal(single.kind,"single");assert.equal(range.kind,"range");assert.deepEqual(validateCalendarEvent(range),[]);
assert.deepEqual(validateCalendarEvent(normalizeCalendarEvent({id:"e3",title:"오류",start:"2027-04-02",end:"2027-04-01"})),["event.range.invalid"]);
assert.deepEqual(normalizeImageFrameValue({assetId:"photo.3",focalPoint:{x:2,y:-1}}).focalPoint,{x:1,y:0});
assert.deepEqual(mergeMonthlyStyle({color:"blue",font:{size:12,weight:400}},{color:"red",font:{weight:700}}),{color:"red",font:{size:12,weight:700}});
console.log("contracts ok");
