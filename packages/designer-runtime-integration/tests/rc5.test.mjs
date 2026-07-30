import assert from "node:assert/strict";
import { PublishingRenderer, ParityComparator } from "../dist/index.js";
const page={id:"p",sourcePageId:"p",role:"cover",size:{width:100,height:50,unit:"mm"},background:{},metadata:{},objects:[{id:"t",sourceObjectId:"t",type:"text",frame:{x:1,y:1,width:20,height:10},rotation:0,opacity:1,visible:true,zIndex:1,style:{fontSize:10},payload:"학교",value:"학교",fingerprint:"x"}]};
const doc={schemaVersion:"1.1",runtimeVersion:"1.0.0-beta.1",templateId:"t",templateRevision:1,generatedAt:new Date().toISOString(),target:"print",pages:[page],diagnostics:[]};
const svg=new PublishingRenderer().toSvg(doc,"p");assert.match(svg,/<svg/);assert.match(svg,/학교/);
const report=new ParityComparator().compare(page,["t"]);assert.equal(report.parity,1);
console.log("designer integration RC5 tests passed");
