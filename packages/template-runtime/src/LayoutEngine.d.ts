import type { ResolvedObject, RuntimeDiagnostic, Size } from "./types.js";
export interface LayoutResult {
    object: ResolvedObject;
    diagnostics: RuntimeDiagnostic[];
}
export declare class LayoutEngine {
    layout(object: ResolvedObject, pageSize: Size, pageId: string): LayoutResult;
    private normalizeFrame;
    private fitText;
}
