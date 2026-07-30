import { LayoutEngine } from "./LayoutEngine.js";
import { CollisionEngine } from "./CollisionEngine.js";
import { ObjectResolver } from "./ObjectResolver.js";
import type { ResolvedPage, RuntimeDataset, RuntimeDiagnostic, RuntimeOptions, TemplatePage } from "./types.js";

export interface PageResolution { page: ResolvedPage; diagnostics: RuntimeDiagnostic[]; }

export class PageResolver {
  constructor(private readonly objects = new ObjectResolver(), private readonly layout = new LayoutEngine(), private readonly collisions = new CollisionEngine()) {}

  resolve(source: TemplatePage, dataset: RuntimeDataset, options: RuntimeOptions): PageResolution {
    const diagnostics: RuntimeDiagnostic[] = [];
    const objects = source.objects.map(item => {
      const resolved = this.objects.resolve(item, dataset, source.id, options);
      diagnostics.push(...resolved.diagnostics);
      const laidOut = this.layout.layout(resolved.object, source.size, source.id);
      diagnostics.push(...laidOut.diagnostics);
      return laidOut.object;
    }).filter(item => item.visible).sort((a, b) => a.zIndex - b.zIndex);
    if (options.collisionPolicy !== "ignore") diagnostics.push(...this.collisions.inspect(objects, source.id));
    return {
      page: {
        id: source.id,
        sourcePageId: source.id,
        role: source.role,
        size: { ...source.size },
        background: { ...(source.background ?? {}) },
        objects,
        metadata: { ...(source.metadata ?? {}) }
      },
      diagnostics
    };
  }
}
