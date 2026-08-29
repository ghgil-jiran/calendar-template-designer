import {
  buildDeskAcademicPackageDocument,
  type DeskAcademicAdaptedDocument,
  type DeskAcademicPackageDocument,
  type DeskAcademicPackageTemplate
} from "./DeskAcademicPackageRuntime.js";

export type DeskAcademicSurfaceRole =
  | "cover-front"
  | "annual-calendar"
  | "school-symbols"
  | "monthly-calendar"
  | "monthly-photo-memo"
  | "back-contact";

export interface DeskAcademicSurface {
  index: number;
  sheet: number;
  side: "front" | "back";
  role: DeskAcademicSurfaceRole;
  monthKey?: string;
}

export interface DeskAcademicSurfaceOptions {
  pageSize?: { width: number; height: number; unit?: string };
}

export function deskAcademicMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function createAcademicMonths(year: number, startMonth = 3): Array<{ year: number; month: number; key: string }> {
  if (!Number.isInteger(year)) throw new TypeError("academic year must be an integer");
  if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) {
    throw new RangeError("academic start month must be between 1 and 12");
  }
  return Array.from({ length: 12 }, (_, offset) => {
    const absoluteMonth = startMonth - 1 + offset;
    const calendarYear = year + Math.floor(absoluteMonth / 12);
    const calendarMonth = absoluteMonth % 12 + 1;
    return { year: calendarYear, month: calendarMonth, key: deskAcademicMonthKey(calendarYear, calendarMonth) };
  });
}

export function createDeskAcademicSurfacePlan(year: number, startMonth = 3): DeskAcademicSurface[] {
  const months = createAcademicMonths(year, startMonth);
  const surfaces: DeskAcademicSurface[] = [
    { index: 0, sheet: 1, side: "front", role: "cover-front" },
    { index: 1, sheet: 1, side: "back", role: "annual-calendar" },
    { index: 2, sheet: 2, side: "front", role: "school-symbols" },
    { index: 3, sheet: 2, side: "back", role: "monthly-photo-memo", monthKey: months[0].key }
  ];
  for (let index = 0; index < 11; index += 1) {
    const sheet = index + 3;
    surfaces.push(
      { index: surfaces.length, sheet, side: "front", role: "monthly-calendar", monthKey: months[index].key },
      { index: surfaces.length + 1, sheet, side: "back", role: "monthly-photo-memo", monthKey: months[index + 1].key }
    );
  }
  surfaces.push(
    { index: surfaces.length, sheet: 14, side: "front", role: "monthly-calendar", monthKey: months[11].key },
    { index: surfaces.length + 1, sheet: 14, side: "back", role: "back-contact" }
  );
  return surfaces;
}

export function createDeskAcademicAdaptedDocument(
  dataset: Record<string, any>,
  options: DeskAcademicSurfaceOptions = {}
): DeskAcademicAdaptedDocument {
  if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) throw new TypeError("dataset must be an object");
  const year = dataset.calendar?.year;
  const startMonth = dataset.calendar?.startMonth ?? 3;
  const plan = createDeskAcademicSurfacePlan(year, startMonth);
  const size = options.pageSize || { width: 260, height: 180, unit: "mm" };
  const pages = plan.map((surface) => {
    const calendarYear = surface.monthKey ? Number(surface.monthKey.slice(0, 4)) : null;
    const calendarMonth = surface.monthKey ? Number(surface.monthKey.slice(5)) : null;
    return {
      id: `integration.surface.${String(surface.index + 1).padStart(2, "0")}`,
      role: surface.role,
      size: { ...size },
      calendarYear,
      calendarMonth,
      monthKey: surface.monthKey,
      sheetNumber: surface.sheet,
      side: surface.side,
      objects: [],
      metadata: {
        number: surface.index + 1,
        sheetNumber: surface.sheet,
        side: surface.side,
        calendarYear,
        calendarMonth,
        generatedBy: "user-service-runtime-bridge"
      }
    };
  });
  return {
    template: { pages },
    dataset,
    composition: { schemaVersion: "desk-academic-surface-plan.v1", complete: true, pages: plan }
  };
}

export function composeDeskAcademicPackageDocument(
  dataset: Record<string, any>,
  packageTemplate: DeskAcademicPackageTemplate,
  options?: DeskAcademicSurfaceOptions
): DeskAcademicPackageDocument {
  return buildDeskAcademicPackageDocument(createDeskAcademicAdaptedDocument(dataset, options), packageTemplate);
}
