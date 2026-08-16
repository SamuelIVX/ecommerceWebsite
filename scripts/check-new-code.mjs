#!/usr/bin/env node
/**
 * check-new-code.mjs
 *
 * Enforces two "new code" standards on a pull request, scoped strictly to the diff:
 *
 *   1. Docstrings  — every exported function/class in a NEWLY ADDED file must carry a
 *      JSDoc block, and any exported function/class NEWLY ADDED inside an existing
 *      (modified) file must too.
 *   2. Colocated tests — every newly ADDED source file must ship a sibling test file
 *      (foo.test.ts / foo.spec.ts / __tests__/foo.test.ts), unless it is test-exempt.
 *
 * Because it only ever looks at the diff, untouched legacy code is never flagged — so
 * this can be added to a mature repo without generating a backlog of violations.
 *
 * Uses the repo's local `typescript` (present in Next.js/TS projects) for accurate AST
 * analysis; falls back to a conservative regex heuristic if TypeScript can't be resolved.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_SHA || 'origin/main';
const HEAD = process.env.HEAD_SHA || 'HEAD';

// ---- Config -----------------------------------------------------------------
const SOURCE_EXT = new Set(['.ts', '.tsx']);

// Files that never need docstrings or tests.
const EXEMPT = [
  /\.d\.ts$/,
  /\.(test|spec)\.[tj]sx?$/,
  /(^|\/)__(tests|mocks)__\//,
  /\.config\.[tj]s$/,
  /(^|\/)(next|tailwind|postcss|jest|vitest|eslint)\.config\./,
  /(^|\/)types?\//,
  /\.types\.tsx?$/,
  /(^|\/)\.next\//,
  /(^|\/)node_modules\//,
];

// Added source files that need a docstring but NOT a colocated unit test — framework
// entrypoints that are exercised by integration/e2e rather than unit tests.
const TEST_EXEMPT = [
  /(^|\/)app\/.*\/(layout|page|loading|error|not-found|template|default|global-error)\.tsx?$/,
  /(^|\/)app\/.*\/route\.tsx?$/,
  /(^|\/)pages\//,
  /(^|\/)middleware\.tsx?$/,
  /\.stories\.tsx?$/,
];

const isExempt = (f) => EXEMPT.some((re) => re.test(f));
const isTestExempt = (f) => TEST_EXEMPT.some((re) => re.test(f));
const isSource = (f) => SOURCE_EXT.has(path.extname(f)) && !isExempt(f);

// ---- Git helpers ------------------------------------------------------------
function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function changedFiles() {
  const out = sh(`git diff --name-status --diff-filter=AMR ${BASE}...${HEAD}`);
  const added = [];
  const modified = [];
  for (const line of out.split('\n').filter(Boolean)) {
    const parts = line.split('\t');
    const status = parts[0];
    const file = parts[parts.length - 1]; // rename lines are "R100\told\tnew"
    // Only a true add (A) gets the full new-file treatment (docstrings on every export
    // + colocated test). Renames (R) are treated as modifications so a pure move doesn't
    // suddenly demand docs/tests on pre-existing code — only newly added lines are checked.
    if (status.startsWith('A')) added.push(file);
    else if (status.startsWith('M') || status.startsWith('R')) modified.push(file);
  }
  return { added, modified };
}

// Set of line numbers (in the new revision of the file) that this diff added.
function addedLineSet(file) {
  const set = new Set();
  let out = '';
  try {
    out = sh(`git diff -U0 ${BASE}...${HEAD} -- "${file}"`);
  } catch {
    return set;
  }
  for (const line of out.split('\n')) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (!m) continue;
    const start = Number(m[1]);
    const count = m[2] === undefined ? 1 : Number(m[2]);
    for (let i = 0; i < count; i++) set.add(start + i);
  }
  return set;
}

// ---- Colocated-test resolution ----------------------------------------------
// Build a repo-wide index of test files once, keyed by their base name (minus the
// .test/.spec suffix). This tolerates every layout these repos use: sibling tests,
// sibling __tests__/ dirs, and centralized mirrors like lib/__tests__/supabase/x.test.ts.
const TEST_RE = /\.(test|spec)\.[tj]sx?$/;
function testBaseIndex() {
  let files = [];
  try {
    files = sh('git ls-files').split('\n').filter(Boolean);
  } catch {
    return new Set();
  }
  const index = new Set();
  for (const f of files) {
    if (!TEST_RE.test(f)) continue;
    index.add(path.basename(f).replace(TEST_RE, '')); // e.g. "benefits.test.ts" -> "benefits"
  }
  return index;
}
const TEST_INDEX = testBaseIndex();

function expectedTestNames(file) {
  const dir = path.dirname(file);
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  return [
    path.join(dir, `${base}.test${ext}`),
    path.join(dir, `${base}.spec${ext}`),
    path.join(dir, '__tests__', `${base}.test${ext}`),
  ];
}

// Tested if a colocated variant exists OR any test file in the repo shares its base name.
function hasColocatedTest(file) {
  if (expectedTestNames(file).some(existsSync)) return true;
  const ext = path.extname(file);
  return TEST_INDEX.has(path.basename(file, ext));
}

// ---- Exported-declaration discovery -----------------------------------------
let ts = null;
try {
  ts = (await import('typescript')).default;
} catch {
  ts = null;
}

function astDecls(file) {
  const src = readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, kind);
  const decls = [];
  const isExported = (node) =>
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  const visit = (node) => {
    let symKind = null;
    let name = null;
    if (ts.isFunctionDeclaration(node) && isExported(node)) {
      symKind = 'function';
      name = node.name?.text ?? 'default';
    } else if (ts.isClassDeclaration(node) && isExported(node)) {
      symKind = 'class';
      name = node.name?.text ?? 'default';
    } else if (ts.isVariableStatement(node) && isExported(node)) {
      const d = node.declarationList.declarations[0];
      const init = d?.initializer;
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        symKind = 'function';
        name = d.name.getText(sf);
      }
    }
    if (symKind) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      const jsDoc = ts.getJSDocCommentsAndTags(node).length > 0;
      decls.push({ name, kind: symKind, line, jsDoc });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return decls;
}

// Conservative regex fallback (only used if `typescript` is not installed).
function regexDecls(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const decls = [];
  const re =
    /^\s*export\s+(?:default\s+)?(?:async\s+)?(function|class)\s+([A-Za-z0-9_$]+)|^\s*export\s+const\s+([A-Za-z0-9_$]+)\s*(?::[^=]+)?=\s*(?:async\s*)?\(/;
  for (let i = 0; i < lines.length; i++) {
    const m = re.exec(lines[i]);
    if (!m) continue;
    let j = i - 1;
    while (j >= 0 && lines[j].trim() === '') j--;
    decls.push({
      name: m[2] || m[3],
      kind: m[1] === 'class' ? 'class' : 'function',
      line: i + 1,
      jsDoc: j >= 0 && lines[j].trim().endsWith('*/'),
    });
  }
  return decls;
}

const declsOf = ts ? astDecls : regexDecls;

// ---- Main -------------------------------------------------------------------
const { added, modified } = changedFiles();
const problems = [];

for (const file of added.filter(isSource)) {
  for (const d of declsOf(file)) {
    if (!d.jsDoc) {
      problems.push({
        file,
        line: d.line,
        msg: `Exported ${d.kind} "${d.name}" is missing a JSDoc docstring.`,
      });
    }
  }
  if (!isTestExempt(file) && !hasColocatedTest(file)) {
    problems.push({
      file,
      line: 1,
      msg: `New source file has no colocated test (expected e.g. ${path.basename(
        expectedTestNames(file)[0],
      )}).`,
    });
  }
}

// For modified files, only flag exports whose declaration line is newly added.
for (const file of modified.filter(isSource)) {
  if (!ts) continue; // regex + diff mapping is too noisy without an AST — skip
  const addedLines = addedLineSet(file);
  for (const d of declsOf(file)) {
    if (addedLines.has(d.line) && !d.jsDoc) {
      problems.push({
        file,
        line: d.line,
        msg: `Newly added exported ${d.kind} "${d.name}" is missing a JSDoc docstring.`,
      });
    }
  }
}

if (problems.length === 0) {
  console.log('New-code standards passed: docstrings + colocated tests present.');
  process.exit(0);
}

console.log(`New-code standards: ${problems.length} issue(s) found.\n`);
for (const p of problems) {
  console.log(`::error file=${p.file},line=${p.line}::${p.msg}`); // GitHub PR annotation
  console.log(`  ${p.file}:${p.line} — ${p.msg}`);
}
process.exit(1);
