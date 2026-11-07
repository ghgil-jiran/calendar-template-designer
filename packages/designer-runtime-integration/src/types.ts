import type { ResolvedDocument, RuntimeDataset, TemplateDocument } from "../../template-runtime/dist/src/index.js";

export interface LegacyElement {
  id: string;
  type: string;
  x?: number; y?: number; width?: number; height?: number;
  binding?: string; content?: unknown; value?: unknown;
  style?: Record<string, unknown>; visible?: boolean; zIndex?: number;
  [key: string]: unknown;
}
export interface LegacyProject {
  template: { id?: string; revision?: number; masterElements?: Record<string, LegacyElement[]>; [key: string]: unknown };
  productType: { pageSize: { width: number; height: number; unit?: "mm"|"pt"|"px" }; [key: string]: unknown };
  settings?: Record<string, unknown>;
  book: { school?: Record<string, unknown>; events?: unknown[]; pageInstances: Record<string, unknown>[]; elementsByPage?: Record<string, LegacyElement[]>; [key: string]: unknown };
}
export interface IntegrationSnapshot { template: TemplateDocument; dataset: RuntimeDataset; document: ResolvedDocument; }
