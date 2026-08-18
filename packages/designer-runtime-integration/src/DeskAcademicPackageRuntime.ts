import type { TemplatePackageTemplate } from "./TemplatePackageLoader.js";

export interface DeskAcademicPage {
  id: string;
  role: string;
  size: { width: number; height: number; unit?: string };
  calendarYear?: number | null;
  calendarMonth?: number | null;
  metadata?: Record<string, unknown>;
  objects?: Record<string, any>[];
  [key: string]: unknown;
}

export interface DeskAcademicAdaptedDocument {
  template: { pages: DeskAcademicPage[] };
  dataset: Record<string, any>;
  composition?: unknown;
}

export interface DeskAcademicPackageTemplate extends TemplatePackageTemplate {
  extractionStatus?: string;
  calendar?: { defaultRows?: number; defaultWeekStart?: string };
  masterDefinitions: Record<string, Array<Record<string, any>>>;
}

export interface DeskAcademicPackageDocument {
  template: { schemaVersion: string; id: string; revision: string; pages: Array<DeskAcademicPage & { objects: Record<string, any>[] }> };
  dataset: Record<string, any>;
  composition?: unknown;
  packageStatus?: string;
}

export interface DeskAcademicPackageDiagnostic {
  severity: "error" | "warning" | "info";
  code: string;
  pageId?: string;
  role?: string;
  binding?: string;
  expected?: number;
  actual?: number;
}

export type PageBindingResolver = (binding: unknown, page: DeskAcademicPage) => unknown;

export function readDatasetPath(source: unknown, path: unknown): unknown {
  return String(path || "").split(".").filter(Boolean).reduce<unknown>((value, key) => {
    if (value == null || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

export function resolveDeskAcademicPageBinding(binding: unknown, page: DeskAcademicPage): unknown {
  if (typeof binding !== "string") return binding;
  const monthKey = `${Number(page.calendarYear)}-${String(Number(page.calendarMonth)).padStart(2, "0")}`;
  if (binding === "calendar.monthlyImages.current") return `monthlyImages.${monthKey}`;
  return binding.replace("{YYYY-MM}", monthKey);
}

export function frameFromPercentage(
  frame: Record<string, unknown> | undefined,
  size: { width: number; height: number }
): { x: number; y: number; width: number; height: number } {
  const source = frame || { x: 0, y: 0, width: 100, height: 100 };
  return {
    x: Number(source.x || 0) / 100 * size.width,
    y: Number(source.y || 0) / 100 * size.height,
    width: Number(source.width == null ? 100 : source.width) / 100 * size.width,
    height: Number(source.height == null ? 100 : source.height) / 100 * size.height
  };
}

function createRuntimeObject(
  definition: Record<string, any>,
  page: DeskAcademicPage,
  dataset: Record<string, any>,
  index: number,
  resolveBinding: PageBindingResolver
): Record<string, any> {
  const bindingPattern = definition.bindingPattern || definition.targetBindingPattern || definition.binding;
  const binding = resolveBinding(bindingPattern, page) || bindingPattern;
  let payload = definition.bindings
    ? Object.fromEntries(Object.entries(definition.bindings).map(([key, path]) => [key, readDatasetPath(dataset, path)]))
    : binding ? readDatasetPath(dataset, binding) : undefined;
  if ((payload === undefined || payload === null || payload === "") && definition.fallbackBinding) {
    payload = readDatasetPath(dataset, definition.fallbackBinding);
  }
  let contract: Record<string, any> | undefined;
  if (definition.type === "composite-master") {
    contract = {
      ...definition.layout,
      children: (definition.layout?.children || []).map((child: Record<string, any>) => {
        const childBinding = resolveBinding(child.bindingPattern, page) || child.bindingPattern;
        const footer = child.footer
          ? Object.fromEntries(Object.entries(child.footer).map(([key, path]) => [key, readDatasetPath(dataset, path)]))
          : undefined;
        return {
          ...child,
          binding: childBinding,
          payload: childBinding ? readDatasetPath(dataset, childBinding) : undefined,
          footer
        };
      })
    };
  }
  if (definition.type === "calendar") {
    payload = { year: page.calendarYear, month: page.calendarMonth, gridRows: dataset.calendar?.gridRows };
  }
  return {
    id: definition.id || `${page.id}.package-object.${index}`,
    sourceObjectId: definition.id,
    type: definition.type || "semantic-object",
    role: definition.role,
    frame: frameFromPercentage(definition.framePct, page.size),
    binding,
    payload,
    style: definition.style || {},
    contract,
    metadata: {
      fallbackBinding: definition.fallbackBinding,
      hideEmptyFields: definition.hideEmptyFields,
      hideWhenAllEmpty: definition.hideWhenAllEmpty
    },
    visible: true,
    zIndex: Number(definition.zIndex == null ? index : definition.zIndex)
  };
}

export function buildDeskAcademicPackageDocument(
  adapted: DeskAcademicAdaptedDocument,
  packageTemplate: DeskAcademicPackageTemplate,
  resolveBinding: PageBindingResolver = resolveDeskAcademicPageBinding
): DeskAcademicPackageDocument {
  if (!adapted?.template?.pages || !packageTemplate?.masterDefinitions) {
    throw new TypeError("adapted document and package template are required");
  }
  const dataset = {
    ...adapted.dataset,
    calendar: {
      ...(adapted.dataset.calendar || {}),
      gridRows: Number(packageTemplate.calendar?.defaultRows || adapted.dataset.calendar?.gridRows || 5),
      weekStart: packageTemplate.calendar?.defaultWeekStart || adapted.dataset.calendar?.weekStart || "sunday"
    }
  };
  const pages = adapted.template.pages.map((page) => {
    const definitions = packageTemplate.masterDefinitions[page.role] || [];
    const bindingPage = {
      ...page,
      calendarYear: page.calendarYear ?? (page.metadata?.calendarYear as number | undefined),
      calendarMonth: page.calendarMonth ?? (page.metadata?.calendarMonth as number | undefined)
    };
    return {
      ...page,
      objects: definitions.map((definition, index) => createRuntimeObject(definition, bindingPage, dataset, index, resolveBinding)),
      metadata: { ...page.metadata, packageMasterRole: page.role }
    };
  });
  return {
    template: {
      schemaVersion: packageTemplate.schemaVersion,
      id: packageTemplate.templateId,
      revision: packageTemplate.version,
      pages
    },
    dataset,
    composition: adapted.composition,
    packageStatus: packageTemplate.extractionStatus
  };
}

export function validateDeskAcademicPackageDocument(document: DeskAcademicPackageDocument): DeskAcademicPackageDiagnostic[] {
  const diagnostics: DeskAcademicPackageDiagnostic[] = [];
  const pages = document?.template?.pages || [];
  if (pages.length !== 28) diagnostics.push({ severity: "error", code: "PACKAGE_SURFACE_COUNT", expected: 28, actual: pages.length });
  for (const page of pages) {
    if (!page.objects.length) diagnostics.push({ severity: "error", code: "PACKAGE_MASTER_EMPTY", pageId: page.id, role: page.role });
    if (page.role === "monthly-photo-memo") {
      const photo = page.objects[0]?.contract?.children?.find((child: Record<string, any>) => child.id === "monthly-photo");
      if (!photo?.payload) diagnostics.push({ severity: "info", code: "PACKAGE_MONTHLY_IMAGE_EMPTY", pageId: page.id, binding: photo?.binding });
    }
    if (page.role === "back-contact") {
      const contact = page.objects.find((object) => object.id === "back.contact-card");
      if (!contact || !Object.values(contact.payload || {}).some(Boolean)) {
        diagnostics.push({ severity: "info", code: "PACKAGE_CONTACT_EMPTY", pageId: page.id });
      }
    }
    if (page.role === "monthly-calendar") {
      const calendar = page.objects.find((object) => object.type === "calendar");
      if (calendar?.payload?.gridRows !== 5) {
        diagnostics.push({ severity: "error", code: "PACKAGE_CALENDAR_ROWS", pageId: page.id, actual: calendar?.payload?.gridRows });
      }
    }
  }
  return diagnostics;
}
