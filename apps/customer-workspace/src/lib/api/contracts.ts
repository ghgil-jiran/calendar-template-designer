export type SchoolField = {
  key: string;
  binding?: string;
  label: string;
  group: 'basic' | 'contact' | 'symbol';
  required: boolean;
  allowHide: boolean;
  maxLength: number;
  hint?: string;
};
export type TemplateCard = {
  calendarKind?: 'desk' | 'poster';
  majorPages?: number[];
  id: string;
  version: number;
  name: string;
  description: string;
  note: string;
  previewKind: 'reference' | 'shared-example' | 'published' | 'imported';
  sourceUrl?: string;
  photoSlots?: PhotoSlot[];
  coverUrl: string | null;
  representativePages: number[];
  pageCount: number;
  widthMm: number;
  heightMm: number;
  period: string;
  pages: {number: number; label: string; imageUrl: string | null; largeImageUrl?: string | null}[];
  composition: {label: string; count: number}[];
  fields: SchoolField[];
  photoGuide: string;
};
export type CatalogResponse = {
  mode: 'review' | 'published';
  notice: string;
  templates: TemplateCard[];
};
// Input values and explicit visibility are distinct. Neither is a rendered page.
export type SchoolInput = {values: Record<string, string>; hidden: string[]; omitEmptyContacts?: boolean; calendarDisplay?: {includeHolidays:boolean;includeAnniversaries:boolean;includeSolarTerms:boolean;includeLunar:boolean}};
export type ScheduleEvent = {id:string; title:string; startDate:string; endDate:string};
export type ScheduleExtraction = {events:ScheduleEvent[]; warnings:string[]; sourceName:string; totalLines:number;method?:'shared-ai'|'basic'};
export type PhotoInputMode='collect'|'assign';
export type PhotoSlot = {id:string;pageId:string;pageIds?:string[];pageLabel:string;elementId:string;scope:'page'|'master'|'school';masterId?:string;label:string;binding?:string;required:boolean;widthMm:number;heightMm:number};
export type PhotoAssignment = {photoId:string;url:string};

export type PhotoCategory='school'|'monthly'|'both';
export type PhotoSelections=Record<string,PhotoAssignment|null>;
