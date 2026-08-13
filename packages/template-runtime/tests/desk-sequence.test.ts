import {buildAcademicMonths,DESK_REPRESENTATIVE_SEQUENCE,DeskSequenceResolver} from "../src/index.js";
const equal=(actual:unknown,expected:unknown)=>{if(actual!==expected)throw new Error(`expected ${String(expected)}, got ${String(actual)}`)};
const deepEqual=(actual:unknown,expected:unknown)=>equal(JSON.stringify(actual),JSON.stringify(expected));

const months=buildAcademicMonths(2027,3);
equal(months[0]?.key,"2027-03");
equal(months[11]?.key,"2028-02");
const pages=new DeskSequenceResolver().resolve(DESK_REPRESENTATIVE_SEQUENCE,months);
equal(pages.length,28);
deepEqual(pages.slice(0,3).map(page=>page.pageRole),["cover-front","yearly-calendar","school-symbols"]);
const march=pages.filter(page=>page.monthKey==="2027-03");
deepEqual(march.map(page=>page.pageRole),["month-back","month-calendar"]);
equal(march[0]?.pairId,march[1]?.pairId);
equal(new Set(pages.filter(page=>page.monthKey).map(page=>page.pairId)).size,12);
equal(pages.at(-1)?.pageRole,"back-cover");
console.log("desk-sequence ok");
