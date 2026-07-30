import type { ResolvedDocument, ResolvedPage, RuntimeDiagnostic, RuntimeOptions, TemplateDocument } from "./types.js";
export declare class RenderModelBuilder {
    build(template: TemplateDocument, pages: ResolvedPage[], diagnostics: RuntimeDiagnostic[], options: RuntimeOptions, runtimeVersion: string): ResolvedDocument;
}
