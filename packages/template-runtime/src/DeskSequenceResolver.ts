import type { DeskResolvedPageMetadata, DeskSequenceDefinition, DeskSequencePageSpec } from "./types.js";

export interface AcademicMonth { year:number; month:number; key:string; }
export interface DeskResolvedSequencePage extends DeskResolvedPageMetadata { id:string; masterRef:string; }

const monthKey=(year:number,month:number)=>`${year}-${String(month).padStart(2,"0")}`;

export function buildAcademicMonths(academicYear:number,startMonth:number):AcademicMonth[]{
 if(!Number.isInteger(academicYear)||!Number.isInteger(startMonth)||startMonth<1||startMonth>12)throw new RangeError("invalid academic calendar");
 return Array.from({length:12},(_,index)=>{const date=new Date(Date.UTC(academicYear,startMonth-1+index,1));const year=date.getUTCFullYear(),month=date.getUTCMonth()+1;return {year,month,key:monthKey(year,month)};});
}

export class DeskSequenceResolver{
 resolve(definition:DeskSequenceDefinition,months:AcademicMonth[]):DeskResolvedSequencePage[]{
  if(definition.type!=="desk-sequence")throw new Error("desk sequence definition required");
  if(months.length!==12)throw new Error("desk sequence requires exactly 12 academic months");
  const pages:DeskResolvedSequencePage[]=[];
  const append=(spec:DeskSequencePageSpec,index:number,month?:AcademicMonth,pairId?:string)=>pages.push({
   id:month?`${spec.pageRole}.${month.key}`:`${spec.pageRole}.${index+1}`,
   pageRole:spec.pageRole,masterRef:spec.masterRef,side:spec.side??"front",sequenceIndex:pages.length,
   ...(month?{monthKey:month.key,pairId}:{}),
  });
  definition.sequence.forEach((entry,index)=>{
   if("repeat" in entry){months.forEach(month=>{const pairId=`month-pair.${month.key}`;entry.pair.forEach(spec=>append(spec,index,month,pairId));});}
   else append(entry,index);
  });
  return pages;
 }
}

export const DESK_REPRESENTATIVE_SEQUENCE:DeskSequenceDefinition={type:"desk-sequence",sequence:[
 {pageRole:"cover-front",masterRef:"master.cover",side:"front"},
 {pageRole:"yearly-calendar",masterRef:"master.yearly",side:"back"},
 {pageRole:"school-symbols",masterRef:"master.symbols",side:"front"},
 {repeat:"academicMonths",pair:[
  {pageRole:"month-back",masterRef:"master.monthly.back",side:"back"},
  {pageRole:"month-calendar",masterRef:"master.monthly.front",side:"front"},
 ]},
 {pageRole:"back-cover",masterRef:"master.back-cover",side:"back"},
]};
