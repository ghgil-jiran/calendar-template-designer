import type { ResolvedDocument, ResolvedPage, RuntimeDiagnostic, RuntimeOptions, TemplateDocument } from "./types.js";

export class RenderModelBuilder {
  build(template: TemplateDocument, pages: ResolvedPage[], diagnostics: RuntimeDiagnostic[], options: RuntimeOptions, runtimeVersion: string): ResolvedDocument {
    return {
      schemaVersion: "1.1",
      runtimeVersion,
      templateId: template.id,
      templateRevision: template.revision,
      generatedAt: new Date().toISOString(),
      target: options.target ?? "screen",
      pages,
      diagnostics: options.includeDiagnostics === false ? [] : diagnostics
    };
  }
}
