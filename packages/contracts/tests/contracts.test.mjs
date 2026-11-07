import assert from"node:assert/strict";
import{MONTHLY_CALENDAR_PRESET_SCHEMA_VERSION,SCHOOL_DATA_SCHEMA,TEMPLATE_PERSISTENCE_CONTRACT_VERSION,TEMPLATE_SAVE_KINDS,TEMPLATE_STATES,assertCalendarDocument,normalizeSchoolData,validateSchoolData,normalizeAcademicYear,normalizeCalendarEvent,validateCalendarEvent,normalizeImageFrameValue,mergeMonthlyStyle,normalizeMonthlyCalendarPreset}from"../dist/index.js";

assert.equal(TEMPLATE_PERSISTENCE_CONTRACT_VERSION,"1.0");
assert.deepEqual(TEMPLATE_SAVE_KINDS,["manual","restore","publish"]);
assert.deepEqual(TEMPLATE_STATES,["draft","ready","published","archived"]);

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
assert.equal(MONTHLY_CALENDAR_PRESET_SCHEMA_VERSION,"monthly-calendar-preset.v1");
const boxed=normalizeMonthlyCalendarPreset({rows:5,weekStart:"sunday",design:{presetId:"sample-6",monthTitleStyle:"number-stack",gridStyle:"boxed",unknown:"discard"}});
assert.equal(boxed.preset.presetId,"academic-boxed");
assert.equal(boxed.layout.rowsMode,"fixed-5");
assert.deepEqual(boxed.layout.regions,{titlePercent:10,weekdayPercent:4,dateGridPercent:86});
assert.equal(boxed.overrides.monthTitleStyle,"number-stack");
assert.equal("unknown" in boxed.overrides,false);
const underline=normalizeMonthlyCalendarPreset({calendarLayout:{rowsMode:"adaptive",weekStartsOn:"monday",regions:{titlePercent:21,weekdayPercent:4,dateGridPercent:75}},calendarPreset:{presetId:"segmented-underline",presetVersion:"1.0.0"},calendarOverrides:{lineLength:82}});
assert.equal(underline.preset.presetId,"segmented-underline");
assert.equal(underline.layout.weekStartsOn,"monday");
assert.equal(underline.layout.rowsMode,"adaptive");
assert.deepEqual(underline.preset.supportedRows,[5,6]);
assert.equal(underline.overrides.lineLength,82);
const sixRows=normalizeMonthlyCalendarPreset({rows:6,design:{presetId:"sample-3"}});
assert.equal(sixRows.preset.presetId,"segmented-underline");
assert.equal(sixRows.layout.rowsMode,"fixed-6");
assert.deepEqual(sixRows.layout.regions,{titlePercent:21,weekdayPercent:4,dateGridPercent:75});
console.log("contracts ok");
