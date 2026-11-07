import type { RuntimeDataset, RuntimeDiagnostic } from "./types.js";

export interface BindingResolution { found: boolean; value?: unknown; }

export class BindingResolver {
  resolve(path: string | undefined, dataset: RuntimeDataset): BindingResolution {
    if (!path) return { found: false };
    const tokens = this.tokenize(path);
    let current: unknown = dataset;
    for (const token of tokens) {
      if (current === null || current === undefined) return { found: false };
      if (typeof token === "number") {
        if (!Array.isArray(current) || token < 0 || token >= current.length) return { found: false };
        current = current[token];
      } else {
        if (typeof current !== "object" || !(token in current)) return { found: false };
        current = (current as Record<string, unknown>)[token];
      }
    }
    return { found: true, value: current };
  }

  diagnostic(path: string, pageId: string, objectId: string): RuntimeDiagnostic {
    return { severity: "warning", code: "BINDING_NOT_FOUND", message: `Binding '${path}'을 데이터셋에서 찾지 못했습니다.`, pageId, objectId, binding: path };
  }

  private tokenize(path: string): Array<string | number> {
    const normalized = path.replace(/\[(\d+)\]/g, ".$1");
    return normalized.split(".").filter(Boolean).map(token => /^\d+$/.test(token) ? Number(token) : token);
  }
}
