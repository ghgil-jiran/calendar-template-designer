import type { RuntimeDataset, TemplateDocument, TemplateObject, TemplatePage } from "../../template-runtime/dist/src/index.js";
import type { LegacyElement, LegacyProject } from "./types.js";

export class LegacyProjectAdapter {
  toTemplate(project: LegacyProject): TemplateDocument {
    const size = project.productType.pageSize;
    const pages: TemplatePage[] = project.book.pageInstances.map((page, index) => {
      const pageId = String(page.id ?? `page.${index + 1}`);
      const masterId = String(page.masterId ?? "");
      const master = project.template.masterElements?.[masterId] ?? [];
      const local = project.book.elementsByPage?.[pageId] ?? [];
      const objects = [...master, ...local].map((element, i) => this.toObject(element, size.width, size.height, i));
      if (String(page.role ?? "").startsWith("monthly-")) {
        const region = (project.template as any)?.masters?.calendar?.calendarRegionsByType?.[(project.productType as any).category]
          ?? (project.template as any)?.masters?.calendar?.calendarRegion ?? { x: 5, y: 16, width: 90, height: 79 };
        objects.unshift(this.toObject({ id:`${pageId}.calendar`, type:"calendar", ...region, zIndex:0, value:{ year:page.calendarYear, month:page.calendarMonth } }, size.width, size.height, -1));
      }
      return { id:pageId, role:String(page.role ?? "page"), size:{width:size.width,height:size.height,unit:size.unit ?? "mm"}, objects,
        metadata:{ number:page.number, side:page.side, calendarYear:page.calendarYear, calendarMonth:page.calendarMonth, masterId } };
    });
    return { schemaVersion:"1.0", id:String(project.template.id ?? "legacy.template"), revision:Number(project.template.revision ?? 1), pages,
      metadata:{ sourceFormat:"acdl-project", integration:"designer-runtime-rc4" } };
  }
  toDataset(project: LegacyProject): RuntimeDataset {
    return { schemaVersion:"1.0", locale:"ko-KR", school:project.book.school ?? {}, calendar:{ year:project.settings?.year, startMonth:project.settings?.startMonth, events:project.book.events ?? [] }, variables:{ settings:project.settings ?? {} } };
  }
  private toObject(element: LegacyElement, pageWidth: number, pageHeight: number, index: number): TemplateObject {
    const pct=(v:unknown, total:number)=>Number(v ?? 0) / 100 * total;
    const value = element.value ?? element.content ?? (element.type === "image" || element.type === "image-frame" ? element.src ?? element.image ?? null : undefined);
    return { id:String(element.id ?? `legacy.object.${index}`), type:String(element.type ?? "shape"),
      frame:{x:pct(element.x,pageWidth),y:pct(element.y,pageHeight),width:pct(element.width ?? 10,pageWidth),height:pct(element.height ?? 10,pageHeight)},
      binding:typeof element.binding === "string" ? element.binding : undefined, value, style:{...(element.style ?? {}), legacyRole:element.role}, visible:element.visible !== false, zIndex:Number(element.zIndex ?? index) };
  }
}
