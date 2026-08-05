import type { RuntimeDataset, TemplateDocument, TemplateObject, TemplatePage } from "../../template-runtime/dist/src/index.js";
import { normalizeAcademicYear, normalizeCalendarEvent, normalizeSchoolData } from "../../contracts/dist/index.js";
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
        metadata:{ number:page.number, side:page.side, calendarYear:page.calendarYear, calendarMonth:page.calendarMonth, masterId,
          pageRole:(page as any).semanticPageRole??page.role,monthKey:(page as any).monthKey,pairId:(page as any).pairId,sequenceIndex:(page as any).sequenceIndex } };
    });
    return { schemaVersion:"1.0", id:String(project.template.id ?? "legacy.template"), revision:Number(project.template.revision ?? 1), pages,
      metadata:{ sourceFormat:"acdl-project", integration:"designer-runtime-rc4" } };
  }
  toDataset(project: LegacyProject): RuntimeDataset {
    const legacySchool=(project.book.school ?? {}) as Record<string,unknown>;
    const school=normalizeSchoolData(legacySchool);
    const academicYear=normalizeAcademicYear(project.settings??{});const events=(project.book.events??[]).map(normalizeCalendarEvent);const monthlyImages=(project.book.monthlyImages??{}) as Record<string,unknown>;const monthlyAssets=(project.book.monthlyImageAssets??{}) as Record<string,unknown>;
    const assets=Object.entries(monthlyImages).map(([monthKey,src])=>({id:String(monthlyAssets[monthKey]??`monthly.${monthKey}`),kind:"image",src:String(src),monthKey}));
    return { schemaVersion:"1.0", locale:"ko-KR", timezone:academicYear.timezone, school:{...legacySchool,...school,modelVersion:"2.0",englishName:school.nameEn ?? legacySchool.englishName}, academicYear,calendar:{ year:academicYear.academicYear, startMonth:academicYear.startMonth,weekStart:project.settings?.weekStart,gridRows:project.settings?.calendarRows??project.settings?.gridRows,events },events,assets,monthlyImages,monthlyStyleOverrides:project.book.monthlyStyleOverrides??project.template.monthlyStyleOverrides??[],variables:{ settings:project.settings ?? {} } };
  }
  private toObject(element: LegacyElement, pageWidth: number, pageHeight: number, index: number): TemplateObject {
    const pct=(v:unknown, total:number)=>Number(v ?? 0) / 100 * total;
    const image=element.image&&typeof element.image==="object"?element.image as Record<string,unknown>:{};const value = element.value ?? element.content ?? (element.type === "image" || element.type === "image-frame" ? {assetId:image.assetId,fit:image.fit??element.fit,focalPoint:image.focalPoint,src:element.src??image.src} : undefined);
    return { id:String(element.id ?? `legacy.object.${index}`), type:String(element.type ?? "shape"),
      frame:{x:pct(element.x,pageWidth),y:pct(element.y,pageHeight),width:pct(element.width ?? 10,pageWidth),height:pct(element.height ?? 10,pageHeight)},
      binding:typeof element.binding === "string" ? element.binding : undefined, value, style:{...(element.style ?? {}), legacyRole:element.role}, visible:element.visible !== false, zIndex:Number(element.zIndex ?? index) };
  }
}
