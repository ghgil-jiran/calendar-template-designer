export class RenderModelBuilder {
    build(template, pages, diagnostics, options, runtimeVersion) {
        return {
            schemaVersion: "1.0",
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
