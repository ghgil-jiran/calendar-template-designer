export class BindingResolver {
    resolve(path, dataset) {
        if (!path)
            return { found: false };
        const tokens = this.tokenize(path);
        let current = dataset;
        for (const token of tokens) {
            if (current === null || current === undefined)
                return { found: false };
            if (typeof token === "number") {
                if (!Array.isArray(current) || token < 0 || token >= current.length)
                    return { found: false };
                current = current[token];
            }
            else {
                if (typeof current !== "object" || !(token in current))
                    return { found: false };
                current = current[token];
            }
        }
        return { found: true, value: current };
    }
    diagnostic(path, pageId, objectId) {
        return { severity: "warning", code: "BINDING_NOT_FOUND", message: `Binding '${path}'을 데이터셋에서 찾지 못했습니다.`, pageId, objectId, binding: path };
    }
    tokenize(path) {
        const normalized = path.replace(/\[(\d+)\]/g, ".$1");
        return normalized.split(".").filter(Boolean).map(token => /^\d+$/.test(token) ? Number(token) : token);
    }
}
