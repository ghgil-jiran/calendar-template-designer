import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const statePath = path.join(root, ".schoolp", "starter-state.json");
const bundledManifestPath = path.join(root, "starter-manifest.json");
const defaultManifestUrl = "https://schoolp-ai-starter.vercel.app/starter-manifest.json";
const args = new Set(process.argv.slice(2));
const jsonMode = args.has("--json");
const hookMode = args.has("--hook");
const quiet = jsonMode || hookMode;

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function formatList(items) {
  if (!items || items.length === 0) return "- 없음";
  return items.map((item) => `- ${item}`).join("\n");
}

function standardFrom(value, manifest) {
  const legacyMap = {
    ...(manifest?.compatibility?.legacyMap || {}),
    ...(manifest?.legacyRevisionMap || {})
  };
  const standards = manifest?.standards || manifest?.updates || [];

  if (!value) return { code: "S000", number: 0 };

  if (typeof value === "object") {
    const comparable = value.revisionNumber ?? value.versionNumber ?? value.number;
    if ((value.code || value.label) && Number.isFinite(Number(comparable))) {
      return {
        code: value.code || value.label,
        label: value.label || value.code,
        number: Number(comparable),
        revisionNumber: Number(comparable),
        versionNumber: Number(comparable),
        major: value.major,
        minor: value.minor
      };
    }
    if (value.currentStandard) return standardFrom(value.currentStandard, manifest);
    if (value.appliedStandard) return standardFrom(value.appliedStandard, manifest);
  }

  const raw = String(value);
  const mapped = legacyMap[raw];
  if (mapped) return standardFrom(mapped, manifest);

  const found = standards.find((entry) => entry.code === raw || entry.label === raw || entry.revision === raw);
  if (found) return standardFrom(found.standard || found, manifest);

  const vMatch = raw.match(/^v(\d+)(?:\.(\d+))?$/i);
  if (vMatch) {
    const major = Number(vMatch[1]);
    const minor = Number(vMatch[2] || 0);
    const legacyNumber = major * 100 + minor;
    const mapped = legacyMap[`v${major}.${minor}`] || legacyMap[`schoolp-starter@${major}.${minor}`];
    if (mapped) return standardFrom(mapped, manifest);
    return { code: `v${major}.${minor}`, label: `v${major}.${minor}`, number: legacyNumber, versionNumber: legacyNumber, major, minor };
  }

  const starterMatch = raw.match(/^schoolp-starter[@-](\d+)(?:[.-](\d+))?$/i);
  if (starterMatch) {
    const major = Number(starterMatch[1]);
    const minor = Number(starterMatch[2] || 0);
    const versionNumber = major * 100 + minor;
    return {
      code: `schoolp-starter-${major}.${minor}`,
      label: `v${major}.${minor}`,
      number: versionNumber,
      versionNumber,
      major,
      minor
    };
  }

  const sMatch = raw.match(/^S(\d+)$/i);
  if (sMatch) return { code: `S${sMatch[1].padStart(3, "0")}`, label: `S${sMatch[1].padStart(3, "0")}`, number: Number(sMatch[1]) };

  const rMatch = raw.match(/^r(\d+)$/i);
  if (rMatch) {
    const revisionNumber = Number(rMatch[1]);
    const label = `r${String(revisionNumber).padStart(3, "0")}`;
    return { code: label, label, revision: label, number: revisionNumber, revisionNumber };
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const label = `r${String(numeric).padStart(3, "0")}`;
    return { code: label, label, revision: label, number: numeric, revisionNumber: numeric };
  }

  return { code: raw, label: raw, number: 0 };
}

async function loadManifest(source) {
  if (source.startsWith("file://")) {
    return readJson(new URL(source));
  }

  if (!/^https?:\/\//.test(source)) {
    const manifestPath = path.isAbsolute(source) ? source : path.join(root, source);
    return readJson(manifestPath);
  }

  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

const state = readJson(statePath) || {};
const manifestUrl = process.env.SCHOOLP_STARTER_MANIFEST_URL || state.source || state.starterManifestUrl || defaultManifestUrl;

if (!quiet) {
  console.log("schoolp starter update check");
  console.log(`- manifest: ${manifestUrl}`);
}

let manifest;
let manifestSource = manifestUrl;
try {
  manifest = await loadManifest(manifestUrl);
  if (!manifest) throw new Error("manifest file not found or empty");
} catch (error) {
  const bundledManifest = readJson(bundledManifestPath);

  if (!bundledManifest) {
    if (hookMode) process.exit(0);
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, manifestUrl, error: error.message }, null, 2));
    } else {
      console.error("");
      console.error("최신 기준 확인 실패");
      console.error(`- ${error.message}`);
      console.error("네트워크 또는 Vercel 접근을 확인한 뒤 다시 실행하세요.");
    }
    process.exit(1);
  }

  manifest = bundledManifest;
  manifestSource = "bundled starter-manifest.json";

  if (!quiet) {
    console.error("");
    console.error("공개 manifest 확인 실패");
    console.error(`- ${error.message}`);
    console.error("ZIP 안의 starter-manifest.json으로 현재 기준만 비교합니다.");
  }
}

const localStandard = standardFrom(state.appliedStandard || state.currentStandard || state.lastAppliedRevision, manifest);
const latestStandard = standardFrom(manifest.currentStandard, manifest);
const needsUpdate = latestStandard.number > localStandard.number;
const standards = manifest.standards || manifest.updates || [];
const candidates = needsUpdate
  ? standards.filter((entry) => standardFrom(entry.standard || entry, manifest).number > localStandard.number)
  : [];

const result = {
  ok: true,
  manifestUrl,
  manifestSource,
  localStandard,
  latestStandard,
  needsUpdate,
  candidates
};

if (hookMode) {
  if (needsUpdate) {
    const localLabel = localStandard.label || localStandard.code;
    const latestLabel = latestStandard.label || latestStandard.code;
    const additionalContext = [
      `schoolp starter 기준이 오래됐습니다(현재 ${localLabel} → 최신 ${latestLabel}).`,
      `이번 대화의 첫 응답 맨 앞에서, 팀원의 원래 요청을 처리하기 전에 예/아니오로 먼저 물어보세요: "스타터 업데이트가 있어요(${localLabel} → ${latestLabel}). 지금 반영할까요? 기존 화면·기능·스타일은 그대로 두고 부족한 기준(문서·스킬·스크립트)만 안전하게 맞춥니다. 1) 네, 반영하고 진행 2) 나중에".`,
      `"네"면 docs/UPDATE_APPLY_GUIDE.md 절차로 안전 반영(기존 화면·기능·스타일 변경 금지, .claude/skills·.agents/skills 폴더와 설정·scripts 복사, Claude Code 세션 재시작 안내) 후 원래 요청을 이어서 처리하고 무엇을 바꿨는지 한 줄로 보고하세요.`,
      `"나중에"면 반영하지 말고 원래 요청만 처리하며 이번 세션에서는 다시 묻지 마세요. 앱 코드·설정 병합처럼 위험한 부분은 반영 중 따로 확인하세요.`
    ].join(" ");
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext
      }
    }));
  }
  process.exit(0);
}

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

console.log(`- local standard: ${localStandard.label || localStandard.code}`);
console.log(`- latest standard: ${latestStandard.label || latestStandard.code}`);
console.log(`- updated: ${manifest.currentStandard?.updatedAt || manifest.currentStandard?.publishedAt || manifest.updated || manifest.starter?.updatedAt || "unknown"}`);
console.log(`- status: ${needsUpdate ? "update available" : "up to date"}`);

if (!needsUpdate) {
  console.log("");
  console.log("현재 프로젝트는 최신 starter 기준입니다.");
  process.exit(0);
}

console.log("");
console.log("반영 후보");
for (const update of candidates) {
  const standard = standardFrom(update.standard || update, manifest);
  console.log(`- ${standard.label || standard.code} · ${update.date || update.publishedAt || ""} · ${update.level || "unknown"} · risk:${update.risk || "unknown"}`);
  for (const summary of update.summary || []) {
    console.log(`  - ${summary}`);
  }
  if (update.maintenance?.length) {
    console.log("  Maintenance:");
    for (const item of update.maintenance) console.log(`  - ${item}`);
  }
}

console.log("");
console.log("자동 반영 가능 범위");
console.log(formatList(manifest.safeApply));

console.log("");
console.log("개발자 확인 또는 수동 검토 범위");
console.log(formatList(manifest.manualReview));

console.log("");
console.log("금지");
console.log(formatList(manifest.forbiddenAutoApply));

console.log("");
console.log("다음 단계");
console.log("- 이 명령은 확인만 수행하며 파일을 수정하지 않습니다.");
console.log("- 반영이 필요하면 AI에게 `starter 기준 업데이트해줘`라고 요청하세요.");
console.log("- AI는 기존 UI, 스타일, 기능을 보존하고 부족한 문서/스크립트/설정 기준만 반영해야 합니다.");
