export type EditorMode = "content" | "template";
export interface SelectionState { ids: string[]; primaryId?: string; }
export interface ViewportState { zoom: number; panX: number; panY: number; }
export interface EditorSnapshot<TDocument> { document: TDocument; selection: SelectionState; viewport: ViewportState; mode: EditorMode; }
export interface EditorState<TDocument> extends EditorSnapshot<TDocument> { history: EditorSnapshot<TDocument>[]; future: EditorSnapshot<TDocument>[]; }

const clone = <T>(value:T):T => structuredClone(value);
const snap = <T>(state:EditorState<T>):EditorSnapshot<T> => ({document:clone(state.document),selection:clone(state.selection),viewport:clone(state.viewport),mode:state.mode});
export function createEditorState<T>(document:T):EditorState<T>{ return {document:clone(document),selection:{ids:[]},viewport:{zoom:1,panX:0,panY:0},mode:"content",history:[],future:[]}; }
export function commit<T>(state:EditorState<T>, mutate:(draft:EditorSnapshot<T>)=>void):EditorState<T>{ const previous=snap(state); const next=snap(state); mutate(next); return {...next,history:[...state.history,previous],future:[]}; }
export function undo<T>(state:EditorState<T>):EditorState<T>{ const previous=state.history.at(-1); if(!previous)return state; return {...clone(previous),history:state.history.slice(0,-1),future:[snap(state),...state.future]}; }
export function redo<T>(state:EditorState<T>):EditorState<T>{ const next=state.future[0]; if(!next)return state; return {...clone(next),history:[...state.history,snap(state)],future:state.future.slice(1)}; }
export function setSelection<T>(state:EditorState<T>,ids:string[],primaryId?:string):EditorState<T>{ return {...state,selection:{ids:[...new Set(ids)],primaryId:primaryId ?? ids[0]}}; }
