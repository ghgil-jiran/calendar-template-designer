import { PageResolver } from "./PageResolver.js";
import { RenderModelBuilder } from "./RenderModelBuilder.js";
import type { RuntimeDataset, RuntimeDiagnostic, RuntimeOptions, RuntimeResult, TemplateDocument } from "./types.js";

export const TEMPLATE_RUNTIME_VERSION = "1.0.0-beta.1";

export class TemplateRuntime {
  constructor(private readonly pages = new PageResolver(), private readonly builder = new RenderModelBuilder()) {}

  execute(template: TemplateDocument, dataset: RuntimeDataset, options: RuntimeOptions = {}): RuntimeResult {
    this.assertInput(template, dataset);
    const diagnostics: RuntimeDiagnostic[] = [];
    const pages = template.pages.map(page => {
      const result = this.pages.resolve(page, dataset, options);
      diagnostics.push(...result.diagnostics);
      return result.page;
    });
    const document = this.builder.build(template, pages, diagnostics, options, TEMPLATE_RUNTIME_VERSION);
    return { document, hasErrors: diagnostics.some(item => item.severity === "error") };
  }

  private assertInput(template: TemplateDocument, dataset: RuntimeDataset): void {
    if (!template || template.schemaVersion !== "1.0") throw new Error("지원하지 않는 Template Contract 버전입니다.");
    if (!Array.isArray(template.pages)) throw new Error("Template pages가 배열이 아닙니다.");
    if (!dataset || dataset.schemaVersion !== "1.0") throw new Error("지원하지 않는 Dataset Contract 버전입니다.");
  }
}
