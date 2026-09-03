import type { RenderNode } from "./types.js";

export const MONTHLY_CALENDAR_PRESET_SCHEMA_VERSION="monthly-calendar-preset.v1" as const;
export type RuntimeMonthlyCalendarPresetId="academic-boxed"|"segmented-underline"|"legacy-custom";
export interface RuntimeMonthlyCalendarPresetConfig{
  layout:{rowsMode:"fixed-5"|"fixed-6"|"adaptive";columns:7;weekStartsOn:"sunday"|"monday";regions:{titlePercent:number;weekdayPercent:number;dateGridPercent:number}};
  preset:{schemaVersion:typeof MONTHLY_CALENDAR_PRESET_SCHEMA_VERSION;presetId:RuntimeMonthlyCalendarPresetId;presetVersion:"1.0.0";supportedRows:[5,6]};
  overrides:Record<string,string|number|boolean>;
}
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
const allowed=new Set(["monthTitleStyle","monthTitleAlign","monthTitleSize","fontFamily","textColor","sundayColor","saturdayColor","holidayColor","dateSize","dateAlign","cellPadding","cellGap","lineColor","lineWidth","lineLength","cornerRadius","backgroundColor","eventFontSize","eventBarHeight","eventMaxVisible","showMiniCalendars"]);
function presetId(source:Record<string,unknown>):RuntimeMonthlyCalendarPresetId{
  const direct=record(source.calendarPreset).presetId;if(direct==="academic-boxed"||direct==="segmented-underline"||direct==="legacy-custom")return direct;
  const design=record(source.design);if(design.presetId==="sample-6")return"academic-boxed";if(design.presetId==="sample-3")return"segmented-underline";
  if(design.monthTitleStyle==="number-stack"&&design.weekdayStyle==="filled-tabs"&&design.gridStyle==="boxed")return"academic-boxed";
  if(design.monthTitleStyle==="number-inline"&&design.weekdayStyle==="outlined-pills"&&design.gridStyle==="open-rows")return"segmented-underline";
  return"legacy-custom";
}
export function resolveMonthlyCalendarPreset(node:Pick<RenderNode,"payload"|"style">):RuntimeMonthlyCalendarPresetConfig{
  const payload=record(node.payload),style=record(node.style),source={...style,...payload},id=presetId(source),layout=record(source.calendarLayout),regions=record(layout.regions),defaults=id==="segmented-underline"?{titlePercent:21,weekdayPercent:4,dateGridPercent:75}:{titlePercent:10,weekdayPercent:4,dateGridPercent:86};
  const values=[Number(regions.titlePercent),Number(regions.weekdayPercent),Number(regions.dateGridPercent)],valid=values.every(value=>Number.isFinite(value)&&value>0)&&Math.abs(values.reduce((sum,value)=>sum+value,0)-100)<.001;
  const rows=layout.rowsMode??source.rowsMode??source.rows;const rowsMode=rows==="fixed-5"||rows===5?"fixed-5":rows==="fixed-6"||rows===6?"fixed-6":"adaptive";const overrides:Record<string,string|number|boolean>={};
  for(const [key,value]of Object.entries({...record(source.design),...record(source.calendarOverrides)}))if(allowed.has(key)&&(typeof value==="string"||typeof value==="number"||typeof value==="boolean"))overrides[key]=value;
  return{layout:{rowsMode,columns:7,weekStartsOn:layout.weekStartsOn==="monday"||source.weekStart==="monday"?"monday":"sunday",regions:valid?{titlePercent:values[0]!,weekdayPercent:values[1]!,dateGridPercent:values[2]!}:defaults},preset:{schemaVersion:MONTHLY_CALENDAR_PRESET_SCHEMA_VERSION,presetId:id,presetVersion:"1.0.0",supportedRows:[5,6]},overrides};
}
