export type ShadowDiagnosticSeverity = "error" | "warning" | "info";

export interface ShadowDiagnosticIssue {
  severity?: ShadowDiagnosticSeverity | string;
  code?: string;
  message?: string;
  path?: string;
  pageId?: string;
  role?: string;
  monthKey?: string;
  index?: number;
  expected?: unknown;
  actual?: unknown;
  [key: string]: unknown;
}

export interface UserServiceShadowSessionLike {
  status?: string;
  readyForReview?: boolean;
  diagnostics?: ShadowDiagnosticIssue[];
  adapted?: { dataset?: { schemaVersion?: string } };
  rendered?: { pageCount?: number };
  parity?: {
    data?: {
      matches?: boolean;
      metrics?: {
        pageCount?: number;
        eventCount?: number;
        contactCount?: number;
        monthlyImageCount?: number;
        resolvedMonthlyImageCount?: number;
      };
    };
    visual?: { structurallyReady?: boolean; visuallyApproved?: boolean };
  };
}

export interface UserServiceShadowDiagnosticOptions {
  generatedAt?: string | null;
  documentId?: string | null;
  templateId?: string | null;
  datasetSchemaVersion?: string | null;
}

export interface UserServiceShadowDiagnosticReport {
  schemaVersion: "user-service-shadow-diagnostic.v1";
  generatedAt: string | null;
  source: {
    documentId: string | null;
    templateId: string | null;
    datasetSchemaVersion: string | null;
  };
  status: string;
  readyForReview: boolean;
  approvedForReplacement: false;
  summary: {
    diagnostics: number;
    severities: Record<ShadowDiagnosticSeverity, number> & Record<string, number>;
    pageCount: number;
    eventCount: number;
    contactCount: number;
    monthlyImageCount: number;
    resolvedMonthlyImageCount: number;
    dataMatches: boolean;
    visualStructurallyReady: boolean;
    visuallyApproved: boolean;
  };
  issues: ShadowDiagnosticIssue[];
}

const SAFE_ISSUE_FIELDS = [
  "severity", "code", "message", "path", "pageId", "role", "monthKey", "index"
] as const;

export function countShadowDiagnosticsBySeverity(items: ShadowDiagnosticIssue[] = []): Record<ShadowDiagnosticSeverity, number> & Record<string, number> {
  return items.reduce<Record<string, number>>((result, item) => {
    const severity = typeof item?.severity === "string" && item.severity ? item.severity : "info";
    result[severity] = (result[severity] || 0) + 1;
    return result;
  }, { error: 0, warning: 0, info: 0 }) as Record<ShadowDiagnosticSeverity, number> & Record<string, number>;
}

export function sanitizeShadowDiagnosticIssue(item: unknown): ShadowDiagnosticIssue {
  if (!item || typeof item !== "object") return { severity: "info", code: "UNKNOWN_DIAGNOSTIC" };
  const source = item as Record<string, unknown>;
  const safe = Object.fromEntries(
    SAFE_ISSUE_FIELDS.filter((key) => source[key] !== undefined).map((key) => [key, source[key]])
  ) as ShadowDiagnosticIssue;
  for (const key of ["expected", "actual"] as const) {
    const value = source[key];
    if (typeof value === "number" || typeof value === "boolean" || value === null) safe[key] = value;
  }
  return safe;
}

export function createUserServiceShadowDiagnosticReport(
  session: UserServiceShadowSessionLike,
  options: UserServiceShadowDiagnosticOptions = {}
): Readonly<UserServiceShadowDiagnosticReport> {
  if (!session || typeof session !== "object") throw new TypeError("session result must be an object");
  const diagnostics = (session.diagnostics || []).map(sanitizeShadowDiagnosticIssue);
  const data = session.parity?.data;
  const visual = session.parity?.visual;
  return Object.freeze({
    schemaVersion: "user-service-shadow-diagnostic.v1",
    generatedAt: options.generatedAt || null,
    source: {
      documentId: options.documentId || null,
      templateId: options.templateId || null,
      datasetSchemaVersion: options.datasetSchemaVersion || session.adapted?.dataset?.schemaVersion || null
    },
    status: session.status || "blocked",
    readyForReview: session.readyForReview === true,
    approvedForReplacement: false,
    summary: {
      diagnostics: diagnostics.length,
      severities: countShadowDiagnosticsBySeverity(diagnostics),
      pageCount: data?.metrics?.pageCount ?? session.rendered?.pageCount ?? 0,
      eventCount: data?.metrics?.eventCount ?? 0,
      contactCount: data?.metrics?.contactCount ?? 0,
      monthlyImageCount: data?.metrics?.monthlyImageCount ?? 0,
      resolvedMonthlyImageCount: data?.metrics?.resolvedMonthlyImageCount ?? 0,
      dataMatches: data?.matches === true,
      visualStructurallyReady: visual?.structurallyReady === true,
      visuallyApproved: visual?.visuallyApproved === true
    },
    issues: diagnostics
  });
}

export function serializeUserServiceShadowDiagnosticReport(
  session: UserServiceShadowSessionLike,
  options?: UserServiceShadowDiagnosticOptions
): string {
  return JSON.stringify(createUserServiceShadowDiagnosticReport(session, options), null, 2);
}
