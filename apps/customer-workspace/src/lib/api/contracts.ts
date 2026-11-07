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
  id: string;
  version: number;
  name: string;
  description: string;
  note: string;
  previewKind: 'reference' | 'shared-example' | 'published';
  sourceUrl?: string;
  photoSlots?: PhotoSlot[];
  coverUrl: string | null;
  representativePages: number[];
  pageCount: number;
  widthMm: number;
  heightMm: number;
  period: string;
  pages: {number: number; label: string; imageUrl: string | null}[];
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
export type SchoolInput = {values: Record<string, string>; hidden: string[]};
export type ScheduleEvent = {id:string; title:string; startDate:string; endDate:string};
export type ScheduleExtraction = {events:ScheduleEvent[]; warnings:string[]; sourceName:string; totalLines:number};
export type PhotoSlot = {id:string;pageId:string;pageLabel:string;elementId:string;scope:'page'|'master';masterId?:string;label:string;binding?:string;required:boolean;widthMm:number;heightMm:number};
export type PhotoAssignment = {photoId:string;url:string};
