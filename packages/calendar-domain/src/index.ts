export type CalendarType="desk"|"wall"|"poster"|"postcard"; export type WeekStart="sunday"|"monday"; export type GridRows=5|6;
export interface SchoolProfile{id:string;name:string;logoAssetId?:string;flower?:string;tree?:string;song?:string;}
export interface AcademicEvent{id:string;title:string;start:string;end?:string;category?:string;allDay?:boolean;}
export interface CalendarProjectSettings{year:number;startMonth:number;calendarType:CalendarType;weekStart:WeekStart;gridRows:GridRows;frontDividerCount:number;backDividerCount:number;}
export interface CalendarMonth{year:number;month:number;key:string;}
export function buildTwelveMonths(year:number,startMonth:number):CalendarMonth[]{if(startMonth<1||startMonth>12)throw new RangeError("startMonth must be 1..12");return Array.from({length:12},(_,i)=>{const index=startMonth-1+i;const y=year+Math.floor(index/12);const m=index%12+1;return{year:y,month:m,key:`${y}-${String(m).padStart(2,"0")}`};});}
export function validateSettings(s:CalendarProjectSettings):string[]{const e:string[]=[];if(s.year<2000||s.year>2200)e.push("year.out_of_range");if(s.startMonth<1||s.startMonth>12)e.push("startMonth.invalid");if(s.frontDividerCount<0||s.backDividerCount<0)e.push("divider.negative");return e;}
