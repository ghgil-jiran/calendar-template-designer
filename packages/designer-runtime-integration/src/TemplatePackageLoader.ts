export interface TemplatePackageManifest {
  schemaVersion: string;
  templateId: string;
  version: string;
  name?: string;
  productType?: string;
  status?: string;
  publishable?: boolean;
  files: {
    template: string;
    bindings: string;
    print: string;
    parity: string;
    assets?: string;
  };
  [key: string]: unknown;
}

export interface TemplatePackageTemplate {
  schemaVersion: string;
  templateId: string;
  version: string;
  [key: string]: unknown;
}

export interface TemplatePackageFiles {
  manifest: TemplatePackageManifest;
  template: TemplatePackageTemplate;
  bindings: Record<string, unknown>;
  print: Record<string, unknown>;
  parity: Record<string, unknown>;
}

export type LoadedTemplatePackage = Readonly<TemplatePackageFiles>;

export interface TemplatePackageResponse {
  ok: boolean;
  json(): Promise<unknown>;
}

export type TemplatePackageFetcher = (url: string) => Promise<TemplatePackageResponse>;

export const DEFAULT_DESK_ACADEMIC_PACKAGE_BASE = "/templates/desk-academic-standard/1.0.0/";

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Template Package ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`Template Package ${label} must be a non-empty string`);
  }
  return value;
}

export function validateTemplatePackageManifest(value: unknown): TemplatePackageManifest {
  const manifest = requireObject(value, "manifest");
  const files = requireObject(manifest.files, "manifest.files");
  for (const key of ["template", "bindings", "print", "parity"] as const) {
    requireText(files[key], `manifest.files.${key}`);
  }
  return manifest as unknown as TemplatePackageManifest;
}

export function assembleTemplatePackage(files: TemplatePackageFiles): LoadedTemplatePackage {
  const manifest = validateTemplatePackageManifest(files?.manifest);
  const template = requireObject(files?.template, "template") as unknown as TemplatePackageTemplate;
  requireObject(files?.bindings, "bindings");
  requireObject(files?.print, "print");
  requireObject(files?.parity, "parity");
  const manifestId = requireText(manifest.templateId, "manifest.templateId");
  const manifestVersion = requireText(manifest.version, "manifest.version");
  if (manifestId !== requireText(template.templateId, "template.templateId")) {
    throw new Error("Template Package id mismatch");
  }
  if (manifestVersion !== requireText(template.version, "template.version")) {
    throw new Error("Template Package version mismatch");
  }
  return Object.freeze({ manifest, template, bindings: files.bindings, print: files.print, parity: files.parity });
}

function normalizeBase(base: string): string {
  return base.endsWith("/") ? base : `${base}/`;
}

export async function loadTemplatePackage(
  fetcher: TemplatePackageFetcher,
  base = DEFAULT_DESK_ACADEMIC_PACKAGE_BASE
): Promise<LoadedTemplatePackage> {
  if (typeof fetcher !== "function") throw new TypeError("fetcher must be a function");
  const packageBase = normalizeBase(base);
  const read = async (path: string, label: string): Promise<unknown> => {
    const response = await fetcher(`${packageBase}${path}`);
    if (!response?.ok) throw new Error(`Template Package load failed: ${label}`);
    return response.json();
  };
  const manifest = validateTemplatePackageManifest(await read("manifest.json", "manifest.json"));
  const [template, bindings, print, parity] = await Promise.all([
    read(manifest.files.template, manifest.files.template),
    read(manifest.files.bindings, manifest.files.bindings),
    read(manifest.files.print, manifest.files.print),
    read(manifest.files.parity, manifest.files.parity)
  ]);
  return assembleTemplatePackage({
    manifest,
    template: template as TemplatePackageTemplate,
    bindings: bindings as Record<string, unknown>,
    print: print as Record<string, unknown>,
    parity: parity as Record<string, unknown>
  });
}
