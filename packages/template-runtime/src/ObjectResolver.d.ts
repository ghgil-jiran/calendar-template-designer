import { BindingResolver } from "./BindingResolver.js";
import type { ResolvedObject, RuntimeDataset, RuntimeDiagnostic, RuntimeOptions, TemplateObject } from "./types.js";
export interface ObjectResolution {
    object: ResolvedObject;
    diagnostics: RuntimeDiagnostic[];
}
export declare class ObjectResolver {
    private readonly bindings;
    constructor(bindings?: BindingResolver);
    resolve(source: TemplateObject, dataset: RuntimeDataset, pageId: string, options: RuntimeOptions): ObjectResolution;
}
