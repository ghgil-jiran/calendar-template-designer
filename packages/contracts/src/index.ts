export const CONTRACT_VERSION="1.0" as const;
export type Unit="mm"|"pt"|"px"; export interface Size{width:number;height:number;unit:Unit} export interface Frame{x:number;y:number;width:number;height:number}
export interface BindingRef{path:string;fallback?:unknown;format?:string}
export interface DocumentObject{id:string;kind:string;frame:Frame;binding?:BindingRef;value?:unknown;style?:Record<string,unknown>;visible?:boolean;zIndex?:number;rotation?:number;opacity?:number;children?:DocumentObject[]}
export interface DocumentPage{id:string;role:string;size:Size;objects:DocumentObject[];metadata?:Record<string,unknown>}
export interface CalendarDocument{contractVersion:typeof CONTRACT_VERSION;id:string;revision:number;pages:DocumentPage[];metadata?:Record<string,unknown>}
export function assertCalendarDocument(value:unknown):asserts value is CalendarDocument{if(!value||typeof value!=="object")throw new TypeError("document must be an object");const d=value as Partial<CalendarDocument>;if(d.contractVersion!==CONTRACT_VERSION)throw new Error("unsupported contractVersion");if(!d.id||!Array.isArray(d.pages))throw new Error("invalid document");}

export type SchoolDataFieldType="text"|"url"|"richText"|"image"|"entity";
export interface SchoolDataFieldDefinition{key:string;type:SchoolDataFieldType;required?:boolean;label?:string;}
export interface SchoolDataSchema{version:"2.0";fields:SchoolDataFieldDefinition[];}
export interface SchoolAssetReference{assetId?:string;src?:string;alt?:string;}
export interface SchoolRichText{plainText:string;document?:unknown;}
export interface SchoolSymbol{name?:string;description?:string;image?:SchoolAssetReference;}
export interface SchoolContact{label:string;phone?:string;fax?:string;email?:string;}
export interface SchoolData{
  name:string;
  nameEn?:string;
  slogan?:string;
  address?:string;
  website?:string;
  contacts:SchoolContact[];
  logo?:SchoolAssetReference;
  exterior?:SchoolAssetReference;
  motto?:SchoolRichText;
  song?:SchoolSymbol;
  tree?:SchoolSymbol;
  flower?:SchoolSymbol;
  custom?:Record<string,unknown>;
}

export const SCHOOL_DATA_SCHEMA:SchoolDataSchema={version:"2.0",fields:[
  {key:"school.name",type:"text",required:true,label:"학교명"},
  {key:"school.nameEn",type:"text",label:"영문 학교명"},
  {key:"school.slogan",type:"text",label:"학교 슬로건"},
  {key:"school.logo",type:"image",label:"교표"},
  {key:"school.exterior",type:"image",label:"학교 전경"},
  {key:"school.address",type:"text",label:"학교 주소"},
  {key:"school.website",type:"url",label:"학교 홈페이지"},
  {key:"school.contacts",type:"entity",label:"학교 연락처"},
  {key:"school.motto",type:"richText",label:"교훈"},
  {key:"school.song",type:"entity",label:"교가"},
  {key:"school.tree",type:"entity",label:"교목"},
  {key:"school.flower",type:"entity",label:"교화"}
]};

const textValue=(value:unknown):string|undefined=>typeof value==="string"&&value.trim()?value.trim():undefined;
const recordValue=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
function assetValue(value:unknown):SchoolAssetReference|undefined{
  const source=recordValue(value);const src=textValue(source.src)??textValue(source.image);const assetId=textValue(source.assetId);
  return src||assetId?{assetId,src,alt:textValue(source.alt)??textValue(source.name)}:undefined;
}
function symbolValue(value:unknown):SchoolSymbol|undefined{
  const source=recordValue(value);const name=textValue(source.name);const description=textValue(source.description);const image=assetValue(source);
  return name||description||image?{name,description,image}:undefined;
}
function contactValues(value:unknown,phone?:unknown,fax?:unknown):SchoolContact[]{
  if(Array.isArray(value))return value.map(recordValue).map(item=>({label:textValue(item.label)??"연락처",phone:textValue(item.phone),fax:textValue(item.fax),email:textValue(item.email)})).filter(item=>Boolean(item.phone||item.fax||item.email));
  const primaryPhone=textValue(phone),primaryFax=textValue(fax);
  return primaryPhone||primaryFax?[{label:"대표",phone:primaryPhone,fax:primaryFax}]:[];
}

export function normalizeSchoolData(value:unknown):SchoolData{
  const source=recordValue(value);const profile=recordValue(source.profile);const mottoText=textValue(recordValue(profile.motto).description);
  return {
    name:textValue(source.name)??"",
    nameEn:textValue(source.nameEn)??textValue(source.englishName),
    slogan:textValue(source.slogan),address:textValue(source.address),website:textValue(source.website),
    contacts:contactValues(source.contacts,source.phone,source.fax),
    logo:assetValue(source.logo)??assetValue(profile.logo),
    exterior:assetValue(source.exterior)??assetValue(profile.exterior)??assetValue(profile.building),
    motto:mottoText?{plainText:mottoText}:undefined,
    song:symbolValue(source.song)??symbolValue(profile.song),tree:symbolValue(source.tree)??symbolValue(profile.tree),flower:symbolValue(source.flower)??symbolValue(profile.flower),
    custom:Array.isArray(source.customAssets)?{assets:source.customAssets}:undefined
  };
}

export function validateSchoolData(value:SchoolData):string[]{
  const errors:string[]=[];
  if(!value.name.trim())errors.push("school.name.required");
  if(value.website){try{const url=new URL(value.website);if(url.protocol!=="http:"&&url.protocol!=="https:")errors.push("school.website.invalid");}catch{errors.push("school.website.invalid");}}
  value.contacts.forEach((contact,index)=>{if(!contact.label.trim())errors.push(`school.contacts.${index}.label.required`);});
  return errors;
}

export interface AcademicYearModel{version:"1.0";academicYear:number;startMonth:number;monthCount:12;startDate:string;endDate:string;timezone:string;}
export function normalizeAcademicYear(value:unknown):AcademicYearModel{
  const source=recordValue(value);const academicYear=Number(source.academicYear??source.year);const startMonth=Number(source.startMonth??3);
  if(!Number.isInteger(academicYear)||academicYear<2000||academicYear>2200)throw new RangeError("academicYear must be 2000..2200");
  if(!Number.isInteger(startMonth)||startMonth<1||startMonth>12)throw new RangeError("startMonth must be 1..12");
  const endYear=academicYear+(startMonth===1?0:1);const endMonth=startMonth===1?12:startMonth-1;const endDay=new Date(Date.UTC(endYear,endMonth,0)).getUTCDate();
  return {version:"1.0",academicYear,startMonth,monthCount:12,startDate:textValue(source.startDate)??`${academicYear}-${String(startMonth).padStart(2,"0")}-01`,endDate:textValue(source.endDate)??`${endYear}-${String(endMonth).padStart(2,"0")}-${endDay}`,timezone:textValue(source.timezone)??"Asia/Seoul"};
}

export type CalendarEventKind="single"|"range";
export interface CalendarEventData{id:string;title:string;shortTitle?:string;startDate:string;endDate:string;kind:CalendarEventKind;categoryId?:string;allDay:boolean;display?:{hidden?:boolean;priority?:number;colorToken?:string};}
const isoDate=/^\d{4}-\d{2}-\d{2}$/;
export function normalizeCalendarEvent(value:unknown):CalendarEventData{
  const source=recordValue(value);const id=textValue(source.id)??"";const title=textValue(source.title)??textValue(source.name)??"";const startDate=textValue(source.startDate)??textValue(source.start)??"";const endDate=textValue(source.endDate)??textValue(source.end)??startDate;
  return {id,title,shortTitle:textValue(source.shortTitle),startDate,endDate,kind:startDate===endDate?"single":"range",categoryId:textValue(source.categoryId)??textValue(source.category),allDay:source.allDay!==false,display:source.display&&typeof source.display==="object"?source.display as CalendarEventData["display"]:undefined};
}
export function validateCalendarEvent(event:CalendarEventData):string[]{const errors:string[]=[];if(!event.id)errors.push("event.id.required");if(!event.title)errors.push("event.title.required");if(!isoDate.test(event.startDate))errors.push("event.startDate.invalid");if(!isoDate.test(event.endDate))errors.push("event.endDate.invalid");if(isoDate.test(event.startDate)&&isoDate.test(event.endDate)&&event.endDate<event.startDate)errors.push("event.range.invalid");return errors;}

export interface AssetReference{id:string;kind:"image";src:string;widthPx?:number;heightPx?:number;mimeType?:string;alt?:string;}
export interface ImageFrameValue{assetId:string;fit:"cover"|"contain"|"fill";focalPoint:{x:number;y:number};crop?:{x:number;y:number;width:number;height:number};}
export function normalizeImageFrameValue(value:unknown):ImageFrameValue{const source=recordValue(value);const focal=recordValue(source.focalPoint);return {assetId:textValue(source.assetId)??"",fit:source.fit==="contain"||source.fit==="fill"?source.fit:"cover",focalPoint:{x:Math.max(0,Math.min(1,Number(focal.x??.5))),y:Math.max(0,Math.min(1,Number(focal.y??.5)))},crop:source.crop as ImageFrameValue["crop"]};}

export interface MonthlyStyleOverride{monthKey:string;tokens?:Record<string,string|number>;objectStyles?:Record<string,Record<string,unknown>>;}
export function mergeMonthlyStyle(base:Record<string,unknown>,override?:Record<string,unknown>):Record<string,unknown>{const result={...base};for(const [key,value] of Object.entries(override??{})){const previous=result[key];result[key]=previous&&value&&typeof previous==="object"&&typeof value==="object"&&!Array.isArray(previous)&&!Array.isArray(value)?{...(previous as Record<string,unknown>),...(value as Record<string,unknown>)}:value;}return result;}
