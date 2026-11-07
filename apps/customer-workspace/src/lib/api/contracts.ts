export type SchoolField = {
  key: string;
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
  previewKind: 'reference' | 'shared-example';
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
  mode: 'review';
  notice: string;
  templates: TemplateCard[];
};
// Input values and explicit visibility are distinct. Neither is a rendered page.
export type SchoolInput = {values: Record<string, string>; hidden: string[]};
