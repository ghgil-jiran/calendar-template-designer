#!/usr/bin/env node
// 개발자가 GitHub Issue로 남긴 확인 사항을 세션 시작 시 가져온다.
//
// 반드시 fail-open이다. git 저장소가 아니거나, gh가 없거나, 인증이 안 되어 있거나,
// 네트워크가 끊겨 있어도 조용히 종료한다. 팀원 작업을 막지 않는다.

import { execFileSync } from "node:child_process";

const hookMode = process.argv.includes("--hook");

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 8000
    }).trim();
  } catch {
    return null;
  }
}

function quiet(exitCode = 0) {
  process.exit(exitCode);
}

// 1. git 저장소이고 remote가 있는지
const remote = run("git", ["remote", "get-url", "origin"]);
if (!remote) quiet();

// 2. gh 사용 가능하고 인증되어 있는지
if (run("gh", ["--version"]) === null) quiet();
if (run("gh", ["auth", "status"]) === null) quiet();

// 3. 열린 Issue 조회 (코멘트 포함 — 이미 처리한 것을 다시 작업하지 않기 위해)
const raw = run("gh", [
  "issue",
  "list",
  "--state",
  "open",
  "--limit",
  "20",
  "--json",
  "number,title,body,createdAt,comments"
]);
if (!raw) quiet();

let issues;
try {
  issues = JSON.parse(raw);
} catch {
  quiet();
}
if (!Array.isArray(issues) || issues.length === 0) quiet();

// 4. 출력
function flat(text, max) {
  return (text || "").trim().replace(/\s+/g, " ").slice(0, max);
}

const lines = issues.map((issue) => {
  const parts = [`- #${issue.number} ${issue.title}`];
  const body = flat(issue.body, 400);
  if (body) parts.push(`  ${body}`);

  const comments = Array.isArray(issue.comments) ? issue.comments : [];
  if (comments.length > 0) {
    const last = comments[comments.length - 1];
    parts.push(
      `  [처리 기록 ${comments.length}건 — 이미 작업된 항목이다. 다시 처음부터 하지 말 것]`
    );
    parts.push(`  마지막 기록: ${flat(last.body, 300)}`);
  }
  return parts.join("\n");
});

const hasWorked = issues.some(
  (issue) => Array.isArray(issue.comments) && issue.comments.length > 0
);

if (hookMode) {
  const additionalContext = [
    `[개발자 확인 사항 ${issues.length}건]`,
    ...lines,
    "",
    "처리 기준:",
    "- 팀원에게는 GitHub·Issue·저장소 같은 용어를 쓰지 말고 \"개발자 확인 사항이 왔어요\"처럼 서비스 언어로 전한다.",
    "- 기술적 변경(저장소 교체, 의존성 정리 등)은 무엇을 할지 한 줄로 알리고 진행한다. 팀원이 판단할 근거가 없는 것을 묻지 않는다.",
    "- 팀원 눈에 보이는 변화(데이터가 사라짐, 기능이 빠짐, 화면이 달라짐)는 진행 전에 팀원에게 묻는다.",
    "- 반영을 마쳤고 결과를 코드로 확인했으면 `gh issue comment <번호> --body \"<한 일>\"` 후 `gh issue close <번호>`.",
    "- 일부만 처리했거나 판단이 필요하면 코멘트만 남기고 닫지 않는다. 닫힘은 개발자에게 \"완료\"로 읽히므로 확실할 때만 닫는다.",
    "- **[처리 기록]이 붙은 항목은 이미 작업된 것이다.** 기록을 먼저 읽고, 남은 부분만 처리한다. 같은 작업을 다시 하지 않는다. 남은 일이 없으면 아무것도 하지 말고 넘어간다(코멘트도 추가하지 않는다).",
    "- 닫지 않은 항목은 다음 확인 때 다시 나타난다. 판단 기준은 항상 [처리 기록]이다.",
    "- 원래 요청이 있으면 확인 사항을 처리한 뒤 이어서 진행한다."
  ].join("\n");

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext
      }
    })
  );
  quiet();
}

console.log(`개발자 확인 사항 ${issues.length}건`);
console.log("");
for (const line of lines) console.log(line);
