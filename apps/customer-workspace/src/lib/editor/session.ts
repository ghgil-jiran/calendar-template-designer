import '../../../../designer-studio/persistence-project.js';
import '../../../../designer-studio/photo-frame-editing.js';
import '../../../../designer-studio/shared-screen-composition.js';
import '../../../../designer-studio/canvas-geometry.js';
import '../../../../designer-studio/inspector-element.js';
import '../../../../designer-studio/editor-session.js';
import type {NativeProject} from '../materials/native-project';
export type PhotoFit={fit:'cover'|'contain';scale:number;offsetX:number;offsetY:number};
export type EditorTarget={pageId:string;elementId:string;scope:'master'|'page';label:string;x:number;y:number;width:number;height:number;rotation:number;type:string;fontSize:number;rights:Record<string,boolean>};
export type ElementLayout={x:number;y:number;width:number;height:number};
export type PhotoEdit=Pick<EditorTarget,'pageId'|'elementId'|'scope'>&{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;fontSize?:number};
export type EditorState={version:1;pageId:string;edits:PhotoEdit[]};
export type EditorAsset={id:string;url:string};
export type EditorSession={targets:(pageId:string)=>EditorTarget[];select:(target:EditorTarget|null)=>EditorTarget|null;selection:()=>EditorTarget|null;getState:()=>EditorState;getDocument:()=>NativeProject;canUndo:()=>boolean;canRedo:()=>boolean;setPage:(pageId:string)=>void;editPhoto:(patch:{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;fontSize?:number})=>boolean;resetPhoto:()=>boolean;undo:()=>boolean;redo:()=>boolean};
const engine=(globalThis as unknown as {ACDLEditorSession:{apply:(project:NativeProject,state:EditorState,assets:EditorAsset[])=>NativeProject;create:(args:{project:NativeProject;state?:EditorState;assets?:EditorAsset[]})=>EditorSession}}).ACDLEditorSession;
export const applyEditor=engine.apply;
export const createEditorSession=engine.create;

export const moveFrame=(globalThis as unknown as {ACDLCanvasGeometry:{moveFrame:(frame:ElementLayout,dx:number,dy:number)=>{x:number;y:number}}}).ACDLCanvasGeometry.moveFrame;
