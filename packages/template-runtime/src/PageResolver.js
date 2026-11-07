import { LayoutEngine } from "./LayoutEngine.js";
import { ObjectResolver } from "./ObjectResolver.js";
export class PageResolver {
    objects;
    layout;
    constructor(objects = new ObjectResolver(), layout = new LayoutEngine()) {
        this.objects = objects;
        this.layout = layout;
    }
    resolve(source, dataset, options) {
        const diagnostics = [];
        const objects = source.objects.map(item => {
            const resolved = this.objects.resolve(item, dataset, source.id, options);
            diagnostics.push(...resolved.diagnostics);
            const laidOut = this.layout.layout(resolved.object, source.size, source.id);
            diagnostics.push(...laidOut.diagnostics);
            return laidOut.object;
        }).filter(item => item.visible).sort((a, b) => a.zIndex - b.zIndex);
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
