import '../../../../designer-studio/persistence-project.js';
import '../../../../designer-studio/photo-frame-editing.js';
import '../../../../designer-studio/shared-screen-composition.js';
import '../../../../designer-studio/canvas-geometry.js';
import '../../../../designer-studio/inspector-element.js';
import '../../../../designer-studio/editor-session.js';
import type {NativeProject} from '../materials/native-project';
export type PhotoFit={fit:'cover'|'contain';scale:number;offsetX:number;offsetY:number};
export type EditorTarget={pageId:string;elementId:string;scope:'master'|'page';label:string;x:number;y:number;width:number;height:number;rotation:number;type:string;fontSize:number;binding:string;role:string;identity:string;correspondenceKey:string;rights:Record<string,boolean>};
export type ElementLayout={x:number;y:number;width:number;height:number};
export type PhotoEdit=Pick<EditorTarget,'pageId'|'elementId'|'scope'>&{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;fontSize?:number;textStyle?:TextStyle;hidden?:boolean;photoCopy?:{photoId?:string;source?:Pick<EditorTarget,'pageId'|'scope'|'elementId'>}};
export type TextStyle={fontFamily?:string;fontSize?:number;fontWeight?:number;color?:string;fontStyle?:'normal'|'italic';textDecoration?:'none'|'underline'|'line-through'|'underline line-through'};
export type EditorState={version:1;capabilityVersion?:2;pageId:string;edits:PhotoEdit[]};
export type EditorAsset={id:string;url:string};
export type EditorSession={setAssets:(assets:EditorAsset[])=>void;setProject:(project:NativeProject)=>void;applyToMonthlyFronts:()=>boolean;counterparts:(target?:EditorTarget)=>EditorTarget[];applyAcrossPages:(options:{layout?:boolean;image?:boolean})=>boolean;resetBoundPhotos:(binding:string)=>boolean;targets:(pageId:string)=>EditorTarget[];select:(target:EditorTarget|null)=>EditorTarget|null;selection:()=>EditorTarget|null;getState:()=>EditorState;getDocument:()=>NativeProject;canUndo:()=>boolean;canRedo:()=>boolean;setPage:(pageId:string)=>void;editPhoto:(patch:{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;fontSize?:number;textStyle?:TextStyle;hidden?:boolean},sharing?:{layoutAll?:boolean;imageAll?:boolean})=>boolean;resetPhoto:(sharing?:{imageAll?:boolean})=>boolean;undo:()=>boolean;redo:()=>boolean};
const engine=(globalThis as unknown as {ACDLEditorSession:{apply:(project:NativeProject,state:EditorState,assets:EditorAsset[],options?:{capabilities:string})=>NativeProject;create:(args:{project:NativeProject;state?:EditorState;assets?:EditorAsset[];capabilities?:string})=>EditorSession}}).ACDLEditorSession;
export const applyEditor=(project:NativeProject,state:EditorState,assets:EditorAsset[])=>engine.apply(project,state,assets,{capabilities:'school-basic-v2'});
export function createEditorSession(args:Parameters<typeof engine.create>[0]):EditorSession{return engine.create({...args,capabilities:'school-basic-v2'});}

export const moveFrame=(globalThis as unknown as {ACDLCanvasGeometry:{moveFrame:(frame:ElementLayout,dx:number,dy:number)=>{x:number;y:number}}}).ACDLCanvasGeometry.moveFrame;

export const resizeFrame=(globalThis as unknown as {ACDLCanvasGeometry:{resizeFrame:(frame:ElementLayout,handle:string,dx:number,dy:number)=>ElementLayout}}).ACDLCanvasGeometry.resizeFrame;
