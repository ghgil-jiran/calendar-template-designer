import fs from "node:fs";
import path from "node:path";

const nextCachePath = path.join(process.cwd(), ".next");

if (!fs.existsSync(nextCachePath)) {
  console.log(".next cache was already clean.");
  process.exit(0);
}

fs.rmSync(nextCachePath, { recursive: true, force: true });
console.log(".next cache removed.");
