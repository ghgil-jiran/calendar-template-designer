import { BindingResolver } from "./BindingResolver.js";
export class ObjectResolver {
    bindings;
    constructor(bindings = new BindingResolver()) {
        this.bindings = bindings;
    }
    resolve(source, dataset, pageId, options) {
        const diagnostics = [];
        let value = source.value;
        if (source.binding) {
            const result = this.bindings.resolve(source.binding, dataset);
            if (result.found)
                value = result.value;
            else {
                const diagnostic = this.bindings.diagnostic(source.binding, pageId, source.id);
                diagnostic.severity = options.strictBindings ? "error" : "warning";
                diagnostics.push(diagnostic);
            }
        }
        const children = source.children?.map(child => {
            const resolved = this.resolve(child, dataset, pageId, options);
            diagnostics.push(...resolved.diagnostics);
            return resolved.object;
        });
        return {
            object: {
                id: source.id,
                sourceObjectId: source.id,
                type: source.type,
                frame: { ...source.frame },
                value,
                style: { ...(source.style ?? {}) },
                visible: source.visible !== false,
                zIndex: source.zIndex ?? 0,
                ...(children ? { children } : {})
            },
            diagnostics
        };
    }
}
