import type { RuntimeDataset, RuntimeDiagnostic } from "./types.js";
export interface BindingResolution {
    found: boolean;
    value?: unknown;
}
export declare class BindingResolver {
    resolve(path: string | undefined, dataset: RuntimeDataset): BindingResolution;
    diagnostic(path: string, pageId: string, objectId: string): RuntimeDiagnostic;
    private tokenize;
}
