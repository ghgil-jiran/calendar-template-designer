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
export type EditorSession={setAssets:(assets:EditorAsset[])=>void;targets:(pageId:string)=>EditorTarget[];select:(target:EditorTarget|null)=>EditorTarget|null;selection:()=>EditorTarget|null;getState:()=>EditorState;getDocument:()=>NativeProject;canUndo:()=>boolean;canRedo:()=>boolean;setPage:(pageId:string)=>void;editPhoto:(patch:{photoId?:string;fit?:PhotoFit;layout?:ElementLayout;fontSize?:number})=>boolean;resetPhoto:()=>boolean;undo:()=>boolean;redo:()=>boolean};
const engine=(globalThis as unknown as {ACDLEditorSession:{apply:(project:NativeProject,state:EditorState,assets:EditorAsset[])=>NativeProject;create:(args:{project:NativeProject;state?:EditorState;assets?:EditorAsset[]})=>EditorSession}}).ACDLEditorSession;
export const applyEditor=engine.apply;
// Current customer capabilities are deliberately narrower than template permissions.
// Keep historical layout edits readable, but never create new placement/text edits.
export function createEditorSession(args:Parameters<typeof engine.create>[0]):EditorSession{
 const session=engine.create(args);
 const restrict=(target:EditorTarget|null):EditorTarget|null=>target?{...target,rights:{replaceImage:target.rights.replaceImage===true,imageFit:target.rights.imageFit===true,move:false,resize:false,textSize:false}}:null;
 return {...session,targets:id=>session.targets(id).map(target=>restrict(target)!),select:target=>restrict(session.select(target)),selection:()=>restrict(session.selection()),editPhoto:patch=>{
  if(patch.layout!==undefined||patch.fontSize!==undefined)throw Error('현재 사용자 편집기에서는 개체 이동·크기·글자 조정을 허용하지 않아요.');
  return session.editPhoto(patch);
 }};
}

export const moveFrame=(globalThis as unknown as {ACDLCanvasGeometry:{moveFrame:(frame:ElementLayout,dx:number,dy:number)=>{x:number;y:number}}}).ACDLCanvasGeometry.moveFrame;

export const resizeFrame=(globalThis as unknown as {ACDLCanvasGeometry:{resizeFrame:(frame:ElementLayout,handle:string,dx:number,dy:number)=>ElementLayout}}).ACDLCanvasGeometry.resizeFrame;
