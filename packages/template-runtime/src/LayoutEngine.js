export class LayoutEngine {
    layout(object, pageSize, pageId) {
        const diagnostics = [];
        const frame = this.normalizeFrame(object.frame);
        if (frame.x + frame.width > pageSize.width || frame.y + frame.height > pageSize.height) {
            diagnostics.push({ severity: "warning", code: "OBJECT_OUT_OF_BOUNDS", message: "개체가 페이지 영역을 벗어납니다.", pageId, objectId: object.id });
        }
        const next = { ...object, frame };
        if (next.type === "text" && typeof next.value === "string")
            this.fitText(next, diagnostics, pageId);
        return { object: next, diagnostics };
    }
    normalizeFrame(frame) {
        return {
            x: Number.isFinite(frame.x) ? frame.x : 0,
            y: Number.isFinite(frame.y) ? frame.y : 0,
            width: Math.max(0, Number.isFinite(frame.width) ? frame.width : 0),
            height: Math.max(0, Number.isFinite(frame.height) ? frame.height : 0)
        };
    }
    fitText(object, diagnostics, pageId) {
        const text = object.value;
        const style = object.style;
        const fontSize = Number(style.fontSize ?? 12);
        const minFontSize = Number(style.minFontSize ?? Math.max(6, fontSize * 0.6));
        const estimatedCapacity = Math.max(1, (object.frame.width * object.frame.height) / Math.max(1, fontSize * fontSize * 0.55));
        if (text.length <= estimatedCapacity || style.autoFit === false)
            return;
        const ratio = Math.sqrt(estimatedCapacity / text.length);
        const nextSize = Math.max(minFontSize, Math.floor(fontSize * ratio * 10) / 10);
        style.fontSize = nextSize;
        diagnostics.push({ severity: "info", code: "TEXT_AUTOFIT_APPLIED", message: `텍스트 자동 맞춤으로 글자 크기를 ${fontSize}에서 ${nextSize}로 조정했습니다.`, pageId, objectId: object.id });
    }
}
