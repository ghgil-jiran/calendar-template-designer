import assert from "node:assert/strict";
import { PublishingRenderer, ParityComparator } from "../dist/index.js";
const page={id:"p",sourcePageId:"p",role:"cover",size:{width:100,height:50,unit:"mm"},background:{},metadata:{},objects:[{id:"t",sourceObjectId:"t",type:"text",frame:{x:1,y:1,width:20,height:10},rotation:0,opacity:1,visible:true,zIndex:1,style:{fontSize:10},payload:"학교",value:"학교",fingerprint:"x"}]};
const doc={schemaVersion:"1.1",runtimeVersion:"1.0.0-beta.1",templateId:"t",templateRevision:1,generatedAt:new Date().toISOString(),target:"print",pages:[page],diagnostics:[]};
const svg=new PublishingRenderer().toSvg(doc,"p");assert.match(svg,/<svg/);assert.match(svg,/학교/);
const report=new ParityComparator().compare(page,["t"]);assert.equal(report.parity,1);
const widgetPage={...page,objects:[
 {...page.objects[0],id:"image-frame",type:"image-frame",payload:{asset:{id:"asset",src:"data:image/png;base64,AA"}}},
 {...page.objects[0],id:"mini",type:"mini-calendar",payload:{year:2027,month:3,rows:5,weekStart:"sunday",cells:[{day:1,inMonth:true,row:0,column:1}]}},
 {...page.objects[0],id:"strip",type:"month-date-strip",payload:{days:[{day:1,weekday:1}]}},
 {...page.objects[0],id:"memo",type:"memo",payload:{title:"TO DO",layout:"checklist",itemCount:2}}
]};
const widgetDoc={...doc,pages:[widgetPage]},widgetSvg=new PublishingRenderer().toSvg(widgetDoc,"p");
assert.match(widgetSvg,/<image[^>]+data:image\/png/);assert.match(widgetSvg,/>일<\/text>/);assert.match(widgetSvg,/TO DO/);
console.log("designer integration RC5 tests passed");
