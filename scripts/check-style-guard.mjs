import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

/* 스타일 가드는 두 층으로 동작한다.
 *
 * 1) 기본 계약 — Tailwind 연결이 살아 있는지. 모든 프로젝트에서 검사하고, 어기면 실패한다.
 * 2) 디자인 토큰 규율 — 새 토큰 체계와 인라인 색상 금지. **옵트인**이다.
 *
 * 2층을 항상 강제하면, 자기 스타일을 이미 갖춘 기존 프로젝트가 이 스크립트를 받는 순간
 * dev/build 가 막힌다(기존 스타일은 고치면 안 되는 파일이라 빠져나갈 길이 없다).
 * 그래서 `.schoolp/starter-state.json` 의 `styleContract: "tokens-v1"` 이 있을 때만
 * 실패시키고, 없으면 경고만 남긴다. 새로 받는 프로젝트는 켜진 채로 시작한다.
 */
const STYLE_CONTRACT = "tokens-v1";

const errors = [];
const warnings = [];
const tokenIssuesEarly = [];

function readText(relativePath, { required = true } = {}) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    if (required) errors.push(`${relativePath} is missing.`);
    return "";
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function readStarterState() {
  const statePath = path.join(root, ".schoolp", "starter-state.json");
  if (!fs.existsSync(statePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return null;
  }
}

const state = readStarterState();
const strict = state?.styleContract === STYLE_CONTRACT;

// ── 1층: 기본 계약 (항상 검사) ──────────────────────────────────────────────
//
// 여기서 존재를 강제하는 파일은 Next.js + Tailwind 프로젝트라면 반드시 있는 것들뿐이다.
// 설정 파일은 이름이 프로젝트마다 다를 수 있으므로(postcss.config.mjs, .eslintrc 등)
// 있을 때만 내용을 검사하고, 없으면 2층(옵트인)으로 넘긴다.
const globalsCss = readText("src/app/globals.css");
const layout = readText("src/app/layout.tsx");
readText("package.json");

const postcssConfig = readText("postcss.config.js", { required: false });
const eslintConfig = readText("eslint.config.mjs", { required: false });
const tailwindConfig = readText("tailwind.config.ts", { required: false });

for (const [file, source] of [
  ["postcss.config.js", postcssConfig],
  ["eslint.config.mjs", eslintConfig],
  ["tailwind.config.ts", tailwindConfig]
]) {
  if (!source) tokenIssuesEarly.push(`${file} is missing.`);
}

for (const directive of ["@tailwind base;", "@tailwind components;", "@tailwind utilities;"]) {
  if (globalsCss && !globalsCss.includes(directive)) {
    errors.push(`src/app/globals.css must keep "${directive}".`);
  }
}

if (layout && !/import\s+["']\.\/globals\.css["'];?/.test(layout)) {
  errors.push('src/app/layout.tsx must import "./globals.css".');
}

if (postcssConfig && !postcssConfig.includes("tailwindcss")) {
  errors.push("postcss.config.js must include tailwindcss.");
}

if (
  eslintConfig &&
  (!eslintConfig.includes("next/core-web-vitals") || !eslintConfig.includes("next/typescript"))
) {
  errors.push("eslint.config.mjs must keep Next.js core-web-vitals and TypeScript rules.");
}

// ── 2층: 디자인 토큰 규율 (옵트인) ──────────────────────────────────────────
const tokenIssues = [...tokenIssuesEarly];

for (const file of [
  "src/components/ui/badge.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/input.tsx"
]) {
  if (!fs.existsSync(path.join(root, file))) {
    tokenIssues.push(`${file} is missing.`);
  }
}

for (const token of [
  "--background",
  "--foreground",
  "--canvas",
  "--surface",
  "--card",
  "--primary",
  "--accent",
  "--secondary",
  "--muted",
  "--success",
  "--destructive",
  "--border",
  "--border-strong",
  "--ring",
  "--shadow-panel",
  "--shadow-elevated",
  "--font-sans",
  "--radius"
]) {
  if (!globalsCss.includes(token)) {
    tokenIssues.push(`src/app/globals.css must keep design token "${token}".`);
  }
}

for (const bodyRule of ["background: hsl(var(--background))", "color: hsl(var(--foreground))"]) {
  if (!globalsCss.includes(bodyRule)) {
    tokenIssues.push(`src/app/globals.css body rule must keep "${bodyRule}".`);
  }
}

for (const contentPath of [
  "./src/app/**/*.{ts,tsx}",
  "./src/components/**/*.{ts,tsx}",
  "./src/features/**/*.{ts,tsx}",
  "./src/lib/**/*.{ts,tsx}"
]) {
  if (tailwindConfig && !tailwindConfig.includes(contentPath)) {
    tokenIssues.push(`tailwind.config.ts content must include "${contentPath}".`);
  }
}

// 색 토큰은 `hsl(var(--x) / <alpha-value>)` 로 등록되어야 bg-primary/80 같은
// 투명도 수식어가 동작한다. 이게 빠지면 화면에서 층을 만들 방법이 사라진다.
if (tailwindConfig && !tailwindConfig.includes("<alpha-value>")) {
  tokenIssues.push(
    "tailwind.config.ts colors must be registered as `hsl(var(--token) / <alpha-value>)` so opacity modifiers (bg-primary/80) work."
  );
}

// 화면 코드가 디자인 시스템을 우회하지 못하게 한다.
// 색은 반드시 토큰(bg-primary, text-muted-foreground ...)으로만 쓴다.
const FORBIDDEN_CLASS = new RegExp(
  [
    String.raw`\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:white|black)\b`,
    String.raw`\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b`,
    String.raw`\b(?:bg|text|border|ring|fill|stroke)-\[(?:#|rgb|hsl|oklch)`
  ].join("|"),
  "g"
);

function walk(dir) {
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

for (const file of walk(path.join(root, "src"))) {
  const source = fs.readFileSync(file, "utf8");

  source.split("\n").forEach((line, index) => {
    for (const match of line.matchAll(FORBIDDEN_CLASS)) {
      const relative = path.relative(root, file);
      tokenIssues.push(
        `${relative}:${index + 1} uses "${match[0]}". Use a design token from src/app/globals.css instead (bg-canvas, text-muted-foreground, border-border/60, ...).`
      );
    }
  });
}

if (strict) {
  errors.push(...tokenIssues);
} else {
  warnings.push(...tokenIssues);
}

// ── 결과 ────────────────────────────────────────────────────────────────────
if (warnings.length > 0) {
  console.warn(`Style guard: ${warnings.length} design-token suggestion(s) (not blocking).`);
  for (const warning of warnings.slice(0, 10)) {
    console.warn(`- ${warning}`);
  }
  if (warnings.length > 10) {
    console.warn(`- ... and ${warnings.length - 10} more.`);
  }
  console.warn("");
  console.warn(
    'To adopt the schoolp design tokens and enforce them, ask the AI: "디자인 토큰 반영해줘".'
  );
  console.warn("");
}

if (errors.length > 0) {
  console.error("Style guard failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error("");
  console.error("Restore the protected style files before continuing.");
  process.exit(1);
}

console.log(strict ? "Style guard passed (design tokens enforced)." : "Style guard passed.");
