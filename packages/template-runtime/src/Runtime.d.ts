import { PageResolver } from "./PageResolver.js";
import { RenderModelBuilder } from "./RenderModelBuilder.js";
import type { RuntimeDataset, RuntimeOptions, RuntimeResult, TemplateDocument } from "./types.js";
export declare const TEMPLATE_RUNTIME_VERSION = "0.4.0-rc4";
export declare class TemplateRuntime {
    private readonly pages;
    private readonly builder;
    constructor(pages?: PageResolver, builder?: RenderModelBuilder);
    execute(template: TemplateDocument, dataset: RuntimeDataset, options?: RuntimeOptions): RuntimeResult;
    private assertInput;
}
