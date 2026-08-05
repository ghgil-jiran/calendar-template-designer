export type Unit = "mm" | "pt" | "px";
export type ObjectKind = "text" | "image" | "image-frame" | "shape" | "calendar" | "calendar-grid" | "event-list" | "memo" | "group";
export interface Size { width:number; height:number; unit:Unit; }
export interface Rect { x:number; y:number; width:number; height:number; }
export interface TemplateObject { id:string; type:ObjectKind|string; frame:Rect; binding?:string; value?:unknown; style?:Record<string,unknown>; children?:TemplateObject[]; visible?:boolean; zIndex?:number; rotation?:number; opacity?:number; }
export interface TemplatePage { id:string; role:string; size:Size; objects:TemplateObject[]; background?:Record<string,unknown>; metadata?:Record<string,unknown>; }
export interface TemplateDocument { schemaVersion:string; id:string; revision:number; pages:TemplatePage[]; metadata?:Record<string,unknown>; }
export interface MonthlyQuoteContent { title:string; quoteKo:string; quoteEn?:string; source?:string; sourceStatus?:"verified"|"unverified"|"original"|"edited"; translationType?:"original"|"official"|"editorial"; }
export interface RuntimeDataset { schemaVersion:string; locale?:string; timezone?:string; school?:Record<string,unknown>; calendar?:Record<string,unknown>; monthlyImages?:Record<string,unknown>|unknown[]; monthlyQuotes?:Record<string,MonthlyQuoteContent>; variables?:Record<string,unknown>; [key:string]:unknown; }
export interface RuntimeOptions { strictBindings?:boolean; includeDiagnostics?:boolean; target?:"screen"|"print"|"thumbnail"; collisionPolicy?:"report"|"shift"|"ignore"; }
export interface RuntimeDiagnostic { severity:"info"|"warning"|"error"; code:string; message:string; pageId?:string; objectId?:string; binding?:string; }
export interface RenderNode { id:string; sourceObjectId:string; type:string; frame:Rect; rotation:number; opacity:number; visible:boolean; zIndex:number; style:Record<string,unknown>; payload:unknown; value?:unknown; children?:RenderNode[]; fingerprint:string; }
export type ResolvedObject = RenderNode;
export interface ResolvedPage { id:string; sourcePageId:string; role:string; size:Size; background:Record<string,unknown>; objects:RenderNode[]; metadata:Record<string,unknown>; }
export interface ResolvedDocument { schemaVersion:"1.1"; runtimeVersion:string; templateId:string; templateRevision:number; generatedAt:string; target:"screen"|"print"|"thumbnail"; pages:ResolvedPage[]; diagnostics:RuntimeDiagnostic[]; }
export interface RuntimeResult { document:ResolvedDocument; hasErrors:boolean; }
export interface RenderDiff { added:string[]; removed:string[]; changed:string[]; unchanged:string[]; }
export interface TextOverflowPolicy{mode:"warn"|"shrink";minFontSize:number;lineHeight?:number;maxLines?:number;}
export interface TextMeasurement{overflow:boolean;estimatedLines:number;appliedFontSize:number;capacity:number;}
export type DeskPageRole="cover-front"|"yearly-calendar"|"school-symbols"|"month-back"|"month-calendar"|"back-cover";
export interface DeskSequencePageSpec{pageRole:DeskPageRole;masterRef:string;side?:"front"|"back";}
export interface DeskSequenceDefinition{type:"desk-sequence";sequence:Array<DeskSequencePageSpec|{repeat:"academicMonths";pair:[DeskSequencePageSpec,DeskSequencePageSpec]}>;}
export interface DeskResolvedPageMetadata{pageRole:DeskPageRole;monthKey?:string;pairId?:string;side:"front"|"back";sequenceIndex:number;}
