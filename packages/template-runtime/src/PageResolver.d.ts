import { LayoutEngine } from "./LayoutEngine.js";
import { ObjectResolver } from "./ObjectResolver.js";
import type { ResolvedPage, RuntimeDataset, RuntimeDiagnostic, RuntimeOptions, TemplatePage } from "./types.js";
export interface PageResolution {
    page: ResolvedPage;
    diagnostics: RuntimeDiagnostic[];
}
export declare class PageResolver {
    private readonly objects;
    private readonly layout;
    constructor(objects?: ObjectResolver, layout?: LayoutEngine);
    resolve(source: TemplatePage, dataset: RuntimeDataset, options: RuntimeOptions): PageResolution;
}
