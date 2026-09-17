import assert from "node:assert/strict";
import test from "node:test";
import { TemplateRuntime } from "../dist/src/Runtime.js";

const k100={space:"cmyk",c:0,m:0,y:0,k:1};
const vector=(extra={})=>({structure:"native-vector",...extra});
const image=(kind,readiness)=>({structure:"raster-image",image:{kind,readiness,minimumDpi:300,replaceableByUser:kind==="photo"}});
const frame=(x,y,width,height)=>({x,y,width,height});

function representative(){
  const size={width:260,height:180,unit:"mm"};
  return {
    schemaVersion:"1.0",id:"desk-native-print-reference",revision:1,
    printContract:{schemaVersion:"print-contract.v1",profile:"Japan Color 2011 Coated",pdfStandard:"PDF/X-4",coordinateUnit:"mm",productionSizeMm:{width:266,height:186},trimSizeMm:{width:260,height:180},bleedMm:3,safeInsetMm:8,minimumImageDpi:300},
    pages:[
      {id:"native.cover",role:"cover-front",surfaceRole:"cover-front",contentPurpose:"cover",size,objects:[
        {id:"cover.photo",type:"image-frame",role:"school-image",frame:frame(12,12,150,112),binding:"school.exterior",print:image("photo","replacement-required")},
        {id:"cover.year",type:"text",role:"year",frame:frame(174,28,68,28),binding:"calendar.year",style:{fontFamily:"Pretendard",fontSizePt:38},print:vector({textMode:"outline",blackMode:"k100",fill:k100})},
        {id:"cover.school",type:"text",role:"school-name",frame:frame(174,72,68,14),binding:"school.name",style:{fontFamily:"Pretendard",fontSizePt:18},print:vector({textMode:"outline",blackMode:"k100",fill:k100})}
      ]},
      {id:"native.month-front",role:"monthly-front",surfaceRole:"monthly-front",contentPurpose:"monthly-calendar",size,metadata:{calendarYear:2028,calendarMonth:3},objects:[
        {id:"month.title",type:"text",role:"month-title",frame:frame(12,10,42,20),value:"3월",style:{fontFamily:"Pretendard",fontSizePt:28},print:vector({textMode:"outline",blackMode:"k100",fill:k100})},
        {id:"month.grid",type:"calendar-grid",role:"calendar-grid",frame:frame(12,40,236,128),value:{year:2028,month:3},print:vector({blackMode:"k100",stroke:k100})}
      ]},
      {id:"native.month-back",role:"monthly-back",surfaceRole:"monthly-back",contentPurpose:"monthly-photo-memo",size,metadata:{calendarYear:2028,calendarMonth:3},objects:[
        {id:"month.photo",type:"image-frame",role:"monthly-photo",frame:frame(12,12,236,94),binding:"monthlyImages.2028-03",print:image("photo","replacement-required")},
        {id:"month.memo",type:"memo",role:"memo",frame:frame(12,114,236,54),print:vector({blackMode:"k100",stroke:k100})}
      ]}
    ]
  };
}

test("new native print template preserves the Package to Runtime print contract",()=>{
  const result=new TemplateRuntime().execute(representative(),{
    schemaVersion:"1.0",school:{name:"새원칙중학교",exterior:{assetId:"school"}},calendar:{year:2028},monthlyImages:{"2028-03":{assetId:"march"}}
  },{target:"print",strictBindings:true});
  assert.equal(result.hasErrors,false);
  assert.equal(result.document.printContract.productionSizeMm.width,266);
  assert.equal(result.document.pages.length,3);
  assert.equal(result.document.pages[0].objects[0].print.image.readiness,"replacement-required");
  assert.equal(result.document.pages[0].objects[1].print.textMode,"outline");
  assert.equal(result.document.pages[1].objects[1].print.structure,"native-vector");
  assert.equal(typeof result.document.pages[2].objects[0].payload,"object");
});

test("print target blocks missing object policy and invalid physical geometry",()=>{
  const template=representative();
  template.printContract.productionSizeMm.width=265;
  delete template.pages[0].objects[0].print;
  const result=new TemplateRuntime().execute(template,{schemaVersion:"1.0"},{target:"print"});
  assert.equal(result.hasErrors,true);
  assert.ok(result.document.diagnostics.some(item=>item.code==="PRINT_BLEED_GEOMETRY_INVALID"));
  assert.ok(result.document.diagnostics.some(item=>item.code==="PRINT_OBJECT_POLICY_MISSING"&&item.objectId==="cover.photo"));
});

test("screen target remains backward compatible without a print contract",()=>{
  const result=new TemplateRuntime().execute({schemaVersion:"1.0",id:"legacy",revision:1,pages:[]},{schemaVersion:"1.0"},{target:"screen"});
  assert.equal(result.hasErrors,false);
  assert.equal(result.document.printContract,undefined);
});
