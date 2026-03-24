#!/usr/bin/env node

const { execFileSync, spawnSync } = require("node:child_process");
const path = require("node:path");

const ALLOWED_TYPES = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
]);

const TYPE_ICONS = {
  feat: "[feat]",
  fix: "[fix]",
  docs: "[docs]",
  style: "[style]",
  refactor: "[refactor]",
  perf: "[perf]",
  test: "[test]",
  build: "[build]",
  ci: "[ci]",
  chore: "[chore]",
  revert: "[revert]",
};

function runGit(args, options = {}) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trimEnd();
  } catch (error) {
    if (options.allowFailure) {
      return "";
    }
    const stderr = error.stderr ? error.stderr.toString().trim() : "";
    const detail = stderr || error.message;
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
}

function printHelp() {
  const text = `
Usage:
  node generate-commit.cjs [options]

Options:
  --apply               Run git commit with generated message
  --stage-all           Stage all changes if nothing is staged
  --type <type>         Force commit type
  --scope <scope>       Force commit scope
  --subject <subject>   Force commit subject
  --body <body>         Add commit body paragraph
  --max-subject <n>     Subject max length (default 72)
  --print-json          Print JSON output
  --no-icon             Disable icon in preview output
  --help                Show this help
`;
  process.stdout.write(text);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    stageAll: false,
    type: "",
    scope: "",
    subject: "",
    body: "",
    maxSubject: 72,
    printJson: false,
    noIcon: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--stage-all") {
      options.stageAll = true;
    } else if (arg === "--print-json") {
      options.printJson = true;
    } else if (arg === "--no-icon") {
      options.noIcon = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--type" || arg === "--scope" || arg === "--subject" || arg === "--body" || arg === "--max-subject") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 1;
      if (arg === "--type") options.type = value.trim().toLowerCase();
      if (arg === "--scope") options.scope = value.trim();
      if (arg === "--subject") options.subject = value.trim();
      if (arg === "--body") options.body = value.trim();
      if (arg === "--max-subject") {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed < 20) {
          throw new Error("Invalid --max-subject value. Use an integer >= 20.");
        }
        options.maxSubject = parsed;
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function parsePorcelainStatus(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const records = [];

  for (const line of lines) {
    if (line.length < 4) continue;
    const indexStatus = line[0];
    const worktreeStatus = line[1];
    const rawPath = line.slice(3);
    const cleanPath = rawPath.includes(" -> ")
      ? rawPath.split(" -> ").pop()
      : rawPath;

    records.push({
      indexStatus,
      worktreeStatus,
      path: cleanPath.replace(/\\/g, "/"),
      isUntracked: indexStatus === "?" && worktreeStatus === "?",
      staged: indexStatus !== " " && indexStatus !== "?",
      unstaged: worktreeStatus !== " ",
    });
  }

  return records;
}

function parseNameStatus(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const parts = line.split(/\t+/);
    const code = parts[0] || "";
    const p = parts[parts.length - 1] || "";
    return { code, path: p.replace(/\\/g, "/") };
  });
}

function parseNumStat(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const parts = line.split(/\t+/);
    const added = parts[0] === "-" ? 0 : Number.parseInt(parts[0], 10) || 0;
    const deleted = parts[1] === "-" ? 0 : Number.parseInt(parts[1], 10) || 0;
    const filePath = (parts[2] || "").replace(/\\/g, "/");
    return { added, deleted, path: filePath };
  });
}

function hasOnly(files, predicate) {
  if (files.length === 0) return false;
  return files.every((f) => predicate(f.path));
}

function isDocsPath(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower.endsWith(".md") ||
    lower.endsWith(".mdx") ||
    lower.endsWith(".rst") ||
    lower.endsWith(".txt") ||
    lower.startsWith("docs/") ||
    lower === "readme" ||
    lower.startsWith("readme.")
  );
}

function isTestPath(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower.includes("/test/") ||
    lower.includes("/tests/") ||
    lower.includes("__tests__") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".spec.js")
  );
}

function isCiPath(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower.startsWith(".github/workflows/") ||
    lower.startsWith(".gitlab-ci") ||
    lower.startsWith(".circleci/") ||
    lower === "jenkinsfile"
  );
}

function isBuildPath(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower === "package.json" ||
    lower === "pnpm-lock.yaml" ||
    lower === "package-lock.json" ||
    lower === "yarn.lock" ||
    lower.includes("tsconfig") ||
    lower.includes("vite.config") ||
    lower.includes("webpack.config") ||
    lower.includes("rollup.config")
  );
}

function isStylePath(filePath) {
  const lower = filePath.toLowerCase();
  return (
    lower.endsWith(".css") ||
    lower.endsWith(".scss") ||
    lower.endsWith(".less") ||
    lower.endsWith(".sass")
  );
}

function sanitizeScope(scope) {
  return scope
    .toLowerCase()
    .replace(/[^a-z0-9\-_/]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_/]+|[-_/]+$/g, "");
}

function detectScope(filePaths) {
  if (filePaths.length === 0) return "";

  const normalized = filePaths.map((p) => p.replace(/\\/g, "/"));
  const firstSegments = normalized
    .map((p) => p.split("/")[0])
    .filter((seg) => seg && !seg.startsWith("."));
  const uniqueFirst = [...new Set(firstSegments)];

  if (uniqueFirst.length === 1) {
    const segment = uniqueFirst[0];
    if (segment === "src") {
      const secondSegments = normalized
        .map((p) => p.split("/")[1] || "")
        .filter((seg) => seg && !seg.startsWith("."));
      const uniqueSecond = [...new Set(secondSegments)];
      if (uniqueSecond.length === 1) {
        return sanitizeScope(uniqueSecond[0]);
      }
    }
    return sanitizeScope(segment);
  }

  return "";
}

function toWords(input) {
  return input
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function detectTarget(filePaths) {
  if (filePaths.length === 0) return "repository updates";
  if (filePaths.length === 1) {
    const single = filePaths[0].replace(/\\/g, "/");
    const fileName = path.basename(single);
    const dirName = path.basename(path.dirname(single));
    if (dirName && dirName !== ".") {
      return toWords(`${dirName} ${fileName}`);
    }
    return toWords(fileName);
  }

  const scope = detectScope(filePaths);
  if (scope) {
    return toWords(scope);
  }
  return "multiple modules";
}

function detectType(fileEntries, statEntries) {
  if (hasOnly(fileEntries, isDocsPath)) return "docs";
  if (hasOnly(fileEntries, isTestPath)) return "test";
  if (hasOnly(fileEntries, isCiPath)) return "ci";
  if (hasOnly(fileEntries, isBuildPath)) return "build";
  if (hasOnly(fileEntries, isStylePath)) return "style";

  const addedFiles = fileEntries.filter((entry) => entry.code.startsWith("A")).length;
  const totalAdded = statEntries.reduce((sum, entry) => sum + entry.added, 0);
  const totalDeleted = statEntries.reduce((sum, entry) => sum + entry.deleted, 0);

  if (addedFiles > 0 && totalAdded >= totalDeleted) return "feat";
  if (totalDeleted > totalAdded * 1.6) return "refactor";

  const hasSrcTouch = fileEntries.some((entry) => entry.path.startsWith("src/"));
  if (hasSrcTouch) return "fix";

  return "chore";
}

function buildSubject(type, filePaths) {
  const target = detectTarget(filePaths);
  const templates = {
    feat: `add ${target}`,
    fix: `fix ${target}`,
    docs: `update ${target} documentation`,
    style: `format ${target}`,
    refactor: `refactor ${target}`,
    perf: `improve ${target} performance`,
    test: `add tests for ${target}`,
    build: `update build settings for ${target}`,
    ci: `update ci for ${target}`,
    chore: `update ${target}`,
    revert: `revert ${target}`,
  };
  return (templates[type] || templates.chore).replace(/\s+/g, " ").trim();
}

function trimSubject(subject, maxLen) {
  if (subject.length <= maxLen) return subject;
  const words = subject.split(" ");
  const reduced = [];
  for (const word of words) {
    const next = reduced.length ? `${reduced.join(" ")} ${word}` : word;
    if (next.length > maxLen) break;
    reduced.push(word);
  }
  if (reduced.length > 0) {
    return reduced.join(" ");
  }
  return subject.slice(0, maxLen).trim();
}

function removeAiAttribution(text) {
  return text
    .replace(/generated by ai/gi, "")
    .replace(/co-authored-by:.*/gi, "")
    .replace(/\bchatgpt\b/gi, "")
    .replace(/\bgpt[- ]?\d+(\.\d+)?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function composeHeader(type, scope, subject, maxSubjectLen) {
  let cleanType = type.toLowerCase().trim();
  if (!ALLOWED_TYPES.has(cleanType)) {
    cleanType = "chore";
  }
  const cleanScope = sanitizeScope(scope || "");
  let cleanSubject = removeAiAttribution(subject || "").replace(/[.!]+$/g, "");
  if (!cleanSubject) cleanSubject = "update repository";

  const maxLen = Math.max(20, maxSubjectLen);
  cleanSubject = trimSubject(cleanSubject, maxLen);
  if (!cleanSubject) cleanSubject = "update repository";

  return cleanScope ? `${cleanType}(${cleanScope}): ${cleanSubject}` : `${cleanType}: ${cleanSubject}`;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    printHelp();
    process.exit(1);
  }

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  runGit(["rev-parse", "--is-inside-work-tree"]);

  let statusRecords = parsePorcelainStatus(runGit(["status", "--porcelain=v1"]));
  let stagedRecords = statusRecords.filter((record) => record.staged);

  if (stagedRecords.length === 0 && options.stageAll && statusRecords.length > 0) {
    runGit(["add", "-A"]);
    statusRecords = parsePorcelainStatus(runGit(["status", "--porcelain=v1"]));
    stagedRecords = statusRecords.filter((record) => record.staged);
  }

  if (stagedRecords.length === 0) {
    const unstagedCount = statusRecords.filter((record) => record.unstaged || record.isUntracked).length;
    if (unstagedCount > 0) {
      console.error("[ERROR] No staged changes found. Stage files first or use --stage-all.");
    } else {
      console.error("[ERROR] No changes found in working tree.");
    }
    process.exit(1);
  }

  const nameStatusEntries = parseNameStatus(runGit(["diff", "--cached", "--name-status", "--find-renames"]));
  const numStatEntries = parseNumStat(runGit(["diff", "--cached", "--numstat"]));
  const filePaths = nameStatusEntries.map((entry) => entry.path);

  const autoType = detectType(nameStatusEntries, numStatEntries);
  const type = options.type || autoType;
  if (!ALLOWED_TYPES.has(type)) {
    console.error(`[ERROR] Invalid --type '${type}'. Allowed: ${[...ALLOWED_TYPES].join(", ")}`);
    process.exit(1);
  }

  const scope = options.scope || detectScope(filePaths);
  const autoSubject = buildSubject(type, filePaths);
  const subject = options.subject || autoSubject;
  const header = composeHeader(type, scope, subject, options.maxSubject);
  const body = removeAiAttribution(options.body || "");

  const additions = numStatEntries.reduce((sum, entry) => sum + entry.added, 0);
  const deletions = numStatEntries.reduce((sum, entry) => sum + entry.deleted, 0);
  const icon = options.noIcon ? "" : `${TYPE_ICONS[type] || "[commit]"} `;

  const output = {
    type,
    scope: scope || null,
    subject: header.replace(/^[^:]+:\s*/, ""),
    header,
    body: body || null,
    files: filePaths,
    stats: {
      files: filePaths.length,
      additions,
      deletions,
    },
    applied: false,
  };

  if (options.apply) {
    const args = ["commit", "-m", header];
    if (body) args.push("-m", body);
    const result = spawnSync("git", args, { stdio: "inherit" });
    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
    output.applied = true;
  }

  if (options.printJson) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  process.stdout.write(`${icon}${header}\n`);
  process.stdout.write(`files: ${output.stats.files}, +${output.stats.additions}/-${output.stats.deletions}\n`);
  if (body) process.stdout.write(`body: ${body}\n`);
  if (!options.apply) process.stdout.write("preview only (use --apply to commit)\n");
}

try {
  main();
} catch (error) {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
}


