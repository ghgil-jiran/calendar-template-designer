export const CONTRACT_VERSION="1.0" as const;
export type Unit="mm"|"pt"|"px"; export interface Size{width:number;height:number;unit:Unit} export interface Frame{x:number;y:number;width:number;height:number}
export interface BindingRef{path:string;fallback?:unknown;format?:string}
export interface DocumentObject{id:string;kind:string;frame:Frame;binding?:BindingRef;value?:unknown;style?:Record<string,unknown>;visible?:boolean;zIndex?:number;rotation?:number;opacity?:number;children?:DocumentObject[]}
export interface DocumentPage{id:string;role:string;size:Size;objects:DocumentObject[];metadata?:Record<string,unknown>}
export interface CalendarDocument{contractVersion:typeof CONTRACT_VERSION;id:string;revision:number;pages:DocumentPage[];metadata?:Record<string,unknown>}
export function assertCalendarDocument(value:unknown):asserts value is CalendarDocument{if(!value||typeof value!=="object")throw new TypeError("document must be an object");const d=value as Partial<CalendarDocument>;if(d.contractVersion!==CONTRACT_VERSION)throw new Error("unsupported contractVersion");if(!d.id||!Array.isArray(d.pages))throw new Error("invalid document");}
