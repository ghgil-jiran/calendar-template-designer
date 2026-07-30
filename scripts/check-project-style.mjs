import fs from "node:fs";

const required = [
  "apps/designer-studio/index.html",
  "apps/designer-studio/README.md"
];
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) {
  console.error("Style/project guard failed:");
  for (const file of missing) console.error(`- ${file} is missing.`);
  process.exit(1);
}

const html = fs.readFileSync("apps/designer-studio/index.html", "utf8");
if (!html.includes("<!DOCTYPE html") && !html.includes("<!doctype html")) {
  console.error("Style/project guard failed: Designer Studio HTML doctype is missing.");
  process.exit(1);
}

console.log("Style/project guard passed (existing static Designer Studio preserved; schoolp design tokens not enabled).");
