export type Unit = "mm" | "pt" | "px";
export type RuntimeSurfaceRole = "cover-front" | "cover-back" | "front-insert-front" | "front-insert-back" | "monthly-front" | "monthly-back" | "rear-insert-front" | "rear-insert-back" | "back-cover-front" | "back-cover-back" | (string & {});
export type RuntimeContentPurpose = "cover" | "annual-calendar" | "school-symbols" | "school-introduction" | "academic-schedule" | "yearly-plan" | "monthly-calendar" | "monthly-photo-memo" | "back-contact" | "free" | "blank" | (string & {});
export type ObjectKind = "text" | "image" | "image-frame" | "shape" | "vector" | "calendar" | "calendar-grid" | "year-calendar" | "mini-calendar" | "mini-calendar-prev" | "mini-calendar-next" | "month-date-strip" | "event-list" | "monthly-schedule" | "monthly-quote" | "memo" | "semantic-object" | "contact-card" | "group";
export type RuntimeAssetRef = { ref:"package"; id:string } | { ref:"url"; src:string } | { ref:"idb"; id:string };
export type PrintImageKind = "photo" | "ai-background";
export type PrintImageReadiness = "temporary" | "replacement-required" | "print-ready";
export interface PrintColor { space:"cmyk"; c:number; m:number; y:number; k:number; }
export interface PrintImagePolicy { kind:PrintImageKind; readiness:PrintImageReadiness; minimumDpi:number; replaceableByUser:boolean; }
export interface PrintFontPolicy { ref:"package"; assetId:string; sha256:string; postscriptName:string; license:string; outlineAllowed:boolean; }
export interface PrintObjectPolicy {
  structure:"native-vector"|"raster-image";
  textMode?:"outline";
  blackMode?:"k100"|"process";
  fill?:PrintColor;
  stroke?:PrintColor;
  font?:PrintFontPolicy;
  image?:PrintImagePolicy;
}
export interface PrintDocumentContract {
  schemaVersion:"print-contract.v1";
  profile:"Japan Color 2011 Coated";
  pdfStandard:"PDF/X-4";
  coordinateUnit:"mm";
  productionSizeMm:{width:number;height:number};
  trimSizeMm:{width:number;height:number};
  bleedMm:number;
  safeInsetMm:number;
  minimumImageDpi:number;
}
export interface Size { width:number; height:number; unit:Unit; }
export interface Rect { x:number; y:number; width:number; height:number; }
export interface TemplateObject { id:string; type:ObjectKind|string; role?:string; frame:Rect; binding?:string; fallbackBinding?:string; value?:unknown; assetRef?:RuntimeAssetRef; printAsset?:unknown; style?:Record<string,unknown>; printIntent?:Record<string,unknown>; print?:PrintObjectPolicy; runtimeWidget?:Record<string,unknown>; editPolicy?:Record<string,boolean>; userReplaceable?:boolean; shapeType?:string; metadata?:Record<string,unknown>; children?:TemplateObject[]; visible?:boolean; zIndex?:number; rotation?:number; opacity?:number; }
export interface TemplatePage { id:string; role:string; surfaceRole?:RuntimeSurfaceRole; contentPurpose?:RuntimeContentPurpose; masterId?:string; size:Size; objects:TemplateObject[]; background?:Record<string,unknown>; metadata?:Record<string,unknown>; }
export interface TemplateDocument { schemaVersion:string; id:string; revision:number; pages:TemplatePage[]; printContract?:PrintDocumentContract; metadata?:Record<string,unknown>; }
export interface MonthlyQuoteContent { title:string; quoteKo:string; quoteEn?:string; source?:string; sourceStatus?:"verified"|"unverified"|"original"|"edited"; translationType?:"original"|"official"|"editorial"; }
export interface RuntimeDataset { schemaVersion:string; locale?:string; timezone?:string; school?:Record<string,unknown>; calendar?:Record<string,unknown>; monthlyImages?:Record<string,unknown>|unknown[]; monthlyQuotes?:Record<string,MonthlyQuoteContent>; variables?:Record<string,unknown>; [key:string]:unknown; }
export interface RuntimeOptions { strictBindings?:boolean; includeDiagnostics?:boolean; target?:"screen"|"print"|"thumbnail"; collisionPolicy?:"report"|"shift"|"ignore"; }
export interface RuntimeDiagnostic { severity:"info"|"warning"|"error"; code:string; message:string; pageId?:string; objectId?:string; binding?:string; }
export interface RenderNode { id:string; sourceObjectId:string; type:string; role:string; frame:Rect; rotation:number; opacity:number; visible:boolean; zIndex:number; style:Record<string,unknown>; printIntent?:Record<string,unknown>; print?:PrintObjectPolicy; printAsset?:unknown; payload:unknown; value?:unknown; assetRef?:RuntimeAssetRef; runtimeWidget:Record<string,unknown>; editPolicy:Record<string,boolean>; userReplaceable:boolean; shapeType:string; metadata:Record<string,unknown>; children?:RenderNode[]; fingerprint:string; }
export type ResolvedObject = RenderNode;
export interface ResolvedPage { id:string; sourcePageId:string; role:string; surfaceRole:RuntimeSurfaceRole; contentPurpose:RuntimeContentPurpose; masterId:string|null; size:Size; background:Record<string,unknown>; objects:RenderNode[]; metadata:Record<string,unknown>; }
export interface ResolvedDocument { schemaVersion:"1.1"; runtimeVersion:string; templateId:string; templateRevision:number; generatedAt:string; target:"screen"|"print"|"thumbnail"; printContract?:PrintDocumentContract; pages:ResolvedPage[]; diagnostics:RuntimeDiagnostic[]; }
export interface RuntimeResult { document:ResolvedDocument; hasErrors:boolean; }
export interface RenderDiff { added:string[]; removed:string[]; changed:string[]; unchanged:string[]; }
export interface TextOverflowPolicy{mode:"warn"|"shrink";minFontSize:number;lineHeight?:number;maxLines?:number;}
export interface TextMeasurement{overflow:boolean;estimatedLines:number;appliedFontSize:number;capacity:number;}
export type DeskPageRole="cover-front"|"yearly-calendar"|"school-symbols"|"month-back"|"month-calendar"|"back-cover";
export interface DeskSequencePageSpec{pageRole:DeskPageRole;masterRef:string;side?:"front"|"back";}
export interface DeskSequenceDefinition{type:"desk-sequence";sequence:Array<DeskSequencePageSpec|{repeat:"academicMonths";pair:[DeskSequencePageSpec,DeskSequencePageSpec]}>;}
export interface DeskResolvedPageMetadata{pageRole:DeskPageRole;monthKey?:string;pairId?:string;side:"front"|"back";sequenceIndex:number;}
