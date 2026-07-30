import { PageResolver } from "./PageResolver.js";
import { RenderModelBuilder } from "./RenderModelBuilder.js";
export const TEMPLATE_RUNTIME_VERSION = "0.4.0-rc4";
export class TemplateRuntime {
    pages;
    builder;
    constructor(pages = new PageResolver(), builder = new RenderModelBuilder()) {
        this.pages = pages;
        this.builder = builder;
    }
    execute(template, dataset, options = {}) {
        this.assertInput(template, dataset);
        const diagnostics = [];
        const pages = template.pages.map(page => {
            const result = this.pages.resolve(page, dataset, options);
            diagnostics.push(...result.diagnostics);
            return result.page;
        });
        const document = this.builder.build(template, pages, diagnostics, options, TEMPLATE_RUNTIME_VERSION);
        return { document, hasErrors: diagnostics.some(item => item.severity === "error") };
    }
    assertInput(template, dataset) {
        if (!template || template.schemaVersion !== "1.0")
            throw new Error("지원하지 않는 Template Contract 버전입니다.");
        if (!Array.isArray(template.pages))
            throw new Error("Template pages가 배열이 아닙니다.");
        if (!dataset || dataset.schemaVersion !== "1.0")
            throw new Error("지원하지 않는 Dataset Contract 버전입니다.");
    }
}
