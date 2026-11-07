export type RenderTarget="screen"|"print"|"thumbnail";
export interface RenderRequest<TDocument>{document:TDocument;target:RenderTarget;pageIds?:string[];}
export interface RenderArtifact{mimeType:string;content:string|Uint8Array;pageCount:number;diagnostics:string[];}
export interface Renderer<TDocument>{readonly id:string;supports(target:RenderTarget):boolean;render(request:RenderRequest<TDocument>):Promise<RenderArtifact>;}
export class RendererRegistry<TDocument>{private readonly items=new Map<string,Renderer<TDocument>>();register(renderer:Renderer<TDocument>):void{if(this.items.has(renderer.id))throw new Error(`renderer already registered: ${renderer.id}`);this.items.set(renderer.id,renderer);}get(id:string):Renderer<TDocument>{const r=this.items.get(id);if(!r)throw new Error(`renderer not found: ${id}`);return r;}find(target:RenderTarget):Renderer<TDocument>[] {return [...this.items.values()].filter(r=>r.supports(target));}}
