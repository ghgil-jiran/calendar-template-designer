import {
  buildDeskAcademicPackageDocument,
  type DeskAcademicAdaptedDocument,
  type DeskAcademicPackageDocument,
  type DeskAcademicPackageTemplate,
} from "./DeskAcademicPackageRuntime.js";
import { createAcademicMonths } from "./DeskAcademicSurfacePlan.js";

export interface AcademicPackagePageRule {
  page?: number;
  pages?: string;
  repeat?: number;
  role: string;
  monthOffset?: number | string;
}

export interface AcademicPackageTemplate extends DeskAcademicPackageTemplate {
  pageSequence: AcademicPackagePageRule[];
}

export interface AcademicPackageSurfaceOptions {
  pageSize: { width: number; height: number; unit?: string };
  expectedSurfaceCount?: number;
}

function rangeValue(value: string, index: number): number {
  const match = /^(\d+)\.\.(\d+)$/.exec(value);
  if (!match) throw new Error(`Unsupported Package range: ${value}`);
  const start = Number(match[1]);
  const end = Number(match[2]);
  const resolved = start + index;
  if (resolved > end) throw new Error(`Package range overflow: ${value}`);
  return resolved;
}

function numericValue(value: number | string | undefined, index: number, fallback: number): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return rangeValue(value, index);
  return fallback;
}

/** Package pageSequence를 제품 유형과 무관한 단면 목록으로 확장한다. */
export function createAcademicPackageSurfacePlan(
  template: AcademicPackageTemplate,
  academicYear: number,
  startMonth = 3,
) {
  if (!Array.isArray(template?.pageSequence)) throw new TypeError("Package pageSequence is required");
  const months = createAcademicMonths(academicYear, startMonth);
  const surfaces: Array<Record<string, unknown>> = [];
  for (const rule of template.pageSequence) {
    const repeat = Number(rule.repeat ?? 1);
    if (!Number.isInteger(repeat) || repeat < 1) throw new Error(`Invalid Package repeat: ${rule.repeat}`);
    for (let index = 0; index < repeat; index += 1) {
      const pageNumber = numericValue(rule.page ?? rule.pages, index, surfaces.length + 1);
      const monthOffset = rule.monthOffset == null ? null : numericValue(rule.monthOffset, index, index);
      const month = monthOffset == null ? null : months[monthOffset];
      if (monthOffset != null && !month) throw new Error(`Package monthOffset out of range: ${monthOffset}`);
      surfaces.push({
        index: surfaces.length,
        page: pageNumber,
        role: rule.role,
        ...(month ? { monthKey: month.key, calendarYear: month.year, calendarMonth: month.month } : {}),
      });
    }
  }
  return surfaces;
}

export function createAcademicPackageDocument(
  dataset: Record<string, any>,
  template: AcademicPackageTemplate,
  options: AcademicPackageSurfaceOptions,
): DeskAcademicPackageDocument {
  const plan = createAcademicPackageSurfacePlan(
    template,
    Number(dataset.calendar?.year),
    Number(dataset.calendar?.startMonth ?? 3),
  );
  if (options.expectedSurfaceCount != null && plan.length !== options.expectedSurfaceCount) {
    throw new Error(`Package surface count mismatch: expected ${options.expectedSurfaceCount}, actual ${plan.length}`);
  }
  const adapted: DeskAcademicAdaptedDocument = {
    template: {
      pages: plan.map((surface) => ({
        id: `package.surface.${String(Number(surface.index) + 1).padStart(2, "0")}`,
        role: String(surface.role),
        size: options.pageSize,
        calendarYear: surface.calendarYear == null ? null : Number(surface.calendarYear),
        calendarMonth: surface.calendarMonth == null ? null : Number(surface.calendarMonth),
        metadata: { ...surface },
      })),
    },
    dataset,
    composition: {
      schemaVersion: "academic-package-surface-plan.v1",
      complete: true,
      pages: plan,
    },
  };
  return buildDeskAcademicPackageDocument(adapted, template);
}
