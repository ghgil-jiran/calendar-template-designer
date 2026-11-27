import '../../../../designer-studio/photo-frame-model.js';
import '../../../../designer-studio/wall-calendar-policy.js';
import '../../../../designer-studio/persistence-project.js';
import '../../../../designer-studio/photo-frame-editing.js';
import '../../../../designer-studio/shared-screen-composition.js';
import '../../../../designer-studio/canvas-geometry.js';
import '../../../../designer-studio/canvas-input.js';
import '../../../../designer-studio/inspector-element.js';
import '../../../../designer-studio/shared-screen-schedule.js';
import '../../../../designer-studio/graphic-vector-object.js';
import '../../../../designer-studio/editor-session.js';
import type {NativeProject} from '../materials/native-project';
export type PhotoFit={fit:'cover'|'contain';scale:number;offsetX:number;offsetY:number};
export type EditorTarget={pageId:string;elementId:string;scope:'master'|'page';label:string;x:number;y:number;width:number;height:number;rotation:number;type:string;fontSize:number;binding:string;role:string;identity:string;logoGroupId?:string;logoPart?:string;correspondenceKey:string;rights:Record<string,boolean>};
export type ElementLayout={x:number;y:number;width:number;height:number};
export type PhotoEdit=Pick<EditorTarget,'pageId'|'elementId'|'scope'>&{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;text?:string;fill?:string;fontSize?:number;textStyle?:TextStyle;frameStyle?:FrameStyle;hidden?:boolean;calendarSettings?:Record<string,string|boolean|number>;photoCopy?:{photoId?:string;source?:Pick<EditorTarget,'pageId'|'scope'|'elementId'>}};
export type FrameStyle={frameType?:string;background?:string|false;stroke?:string;strokeWidth?:number;softEdgePt?:number;shadow?:boolean;shadowBlur?:number;shadowColor?:string};
export const photoFrameModel=(globalThis as unknown as {ACDLPhotoFrameModel:{catalog:readonly {id:string;name:string}[];background:(style?:unknown,frame?:unknown)=>string;isSchoolBuilding:(frame?:unknown)=>boolean}}).ACDLPhotoFrameModel;
export type TextStyle={strokeAlignment?:'center'|'outside';fontFamily?:string;fontSize?:number;fontWeight?:number;color?:string;backgroundColor?:string;background?:boolean;verticalAlign?:'top'|'middle'|'bottom';letterSpacing?:number;lineHeight?:number;opacity?:number;strokeWidth?:number;strokeColor?:string;shadow?:boolean;shadowX?:number;shadowY?:number;shadowBlur?:number;shadowColor?:string;fontStyle?:'normal'|'italic';textAlign?:'left'|'center'|'right'|'justify';textDecoration?:'none'|'underline'|'line-through'|'underline line-through'};
export type LayerDirection='forward'|'backward'|'front'|'back';
export type PageObjectKind='text'|'image'|'shape'|'frame'|'illustration';
export type PublishedIllustration={id:string;name:string;revision:number;originalAssetId?:string;vectorObject?:unknown;image?:{version:string;width:number;height:number;mimeType:string}};
export type EditorState={version:1;additions?:{id:string;pageId:string;type:PageObjectKind;preset?:string;graphic?:PublishedIllustration}[];layerMoves?:(Pick<EditorTarget,'pageId'|'scope'|'elementId'>&{direction:LayerDirection})[];deskScheduleSizing?:{fontSizePt?:number;barHeight?:number;joinText?:boolean;rangeEachDay?:boolean;bullet?:boolean;showVacationBackground?:boolean;vacationBackgroundColor?:string};deskScheduleStyle?:'bar'|'text'|'line';capabilityVersion?:2;pageId:string;edits:PhotoEdit[];logoMode?:'split'|'combined';logoGeometry?:Partial<Record<'split'|'combined',PhotoEdit[]>>;copies?:{id:string;pageId:string;source:Pick<EditorTarget,'pageId'|'scope'|'elementId'>}[]};
export type EditorAsset={id:string;url:string};
export type EditorSession={canAddObject:(type:PageObjectKind)=>boolean;addObject:(type:PageObjectKind,value?:string|PublishedIllustration)=>EditorTarget;moveLayer:(direction:LayerDirection)=>boolean;setDeskScheduleSizing:(patch:{fontSizePt?:number;barHeight?:number;joinText?:boolean;rangeEachDay?:boolean;bullet?:boolean;showVacationBackground?:boolean;vacationBackgroundColor?:string})=>boolean;setDeskScheduleStyle:(mode:'bar'|'text'|'line')=>boolean;setLogoMode:(mode:'split'|'combined')=>boolean;duplicate:()=>EditorTarget;remove:()=>boolean;setAssets:(assets:EditorAsset[])=>void;setProject:(project:NativeProject)=>void;applyToMonthlyFronts:()=>boolean;counterparts:(target?:EditorTarget)=>EditorTarget[];applyAcrossPages:(options:{layout?:boolean;image?:boolean})=>boolean;resetBoundPhotos:(binding:string)=>boolean;targets:(pageId:string)=>EditorTarget[];select:(target:EditorTarget|null)=>EditorTarget|null;selection:()=>EditorTarget|null;getState:()=>EditorState;getDocument:()=>NativeProject;canUndo:()=>boolean;canRedo:()=>boolean;setPage:(pageId:string)=>void;editPhoto:(patch:{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;text?:string;fill?:string;fontSize?:number;textStyle?:TextStyle;frameStyle?:FrameStyle;hidden?:boolean;calendarSettings?:Record<string,string|boolean|number>},sharing?:{layoutAll?:boolean;monthlyPosition?:boolean;imageAll?:boolean;calendarAll?:boolean})=>boolean;resetPhoto:(sharing?:{imageAll?:boolean})=>boolean;undo:()=>boolean;redo:()=>boolean};
const engine=(globalThis as unknown as {ACDLEditorSession:{apply:(project:NativeProject,state:EditorState,assets:EditorAsset[],options?:{capabilities:string})=>NativeProject;create:(args:{project:NativeProject;state?:EditorState;assets?:EditorAsset[];capabilities?:string})=>EditorSession}}).ACDLEditorSession;
export const applyEditor=(project:NativeProject,state:EditorState,assets:EditorAsset[])=>engine.apply(project,state,assets,{capabilities:'school-basic-v2'});
export function createEditorSession(args:Parameters<typeof engine.create>[0]):EditorSession{return engine.create({...args,capabilities:'school-basic-v2'});}

export const moveFrame=(globalThis as unknown as {ACDLCanvasGeometry:{moveFrame:(frame:ElementLayout,dx:number,dy:number)=>{x:number;y:number}}}).ACDLCanvasGeometry.moveFrame;

export const resizeFrame=(globalThis as unknown as {ACDLCanvasGeometry:{resizeFrame:(frame:ElementLayout,handle:string,dx:number,dy:number)=>ElementLayout}}).ACDLCanvasGeometry.resizeFrame;

const wallStyleApi=(globalThis as unknown as {ACDLWallCalendar:{presets:Record<string,Record<string,string>>;normalize:(value:unknown)=>Record<string,unknown>;presetName:(value:unknown)=>string;resolve:(element:unknown,project:unknown)=>Record<string,unknown>}}).ACDLWallCalendar;
export const wallStylePatch=(name:string):Record<string,string>=>({...wallStyleApi.presets[name]});
export const wallStyleName=(settings:unknown)=>wallStyleApi.presetName(wallStyleApi.normalize(settings||{}));


export const wallOptions=(item:unknown,project:unknown)=>wallStyleApi.resolve(item,project);

export const canvasKeyboardCommand=(globalThis as unknown as {ACDLCanvasInput:{keyboardCommand:(event:KeyboardEvent,activeTagName:string,hasSelection:boolean,pageSize:{width:number;height:number})=>{type:'nudge';deltaX:number;deltaY:number}|{type:'select-all'|'delete'}|null}}).ACDLCanvasInput.keyboardCommand;
