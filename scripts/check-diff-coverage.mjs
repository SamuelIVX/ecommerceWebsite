#!/usr/bin/env node
/**
 * check-diff-coverage.mjs
 *
 * Coverage gate, scoped to the diff: every NEWLY ADDED source file must
 * hit a minimum line-coverage threshold. This is the quantitative complement to the
 * structural "colocated test exists" check in check-new-code.mjs — a test file can
 * exist yet cover nothing, and this catches that.
 *
 * Reads coverage/coverage-summary.json (Jest: --coverageReporters=json-summary,
 * Vitest: coverage.reporter 'json-summary'). If the summary is absent the gate is
 * skipped with a warning rather than failing the build.
 *
 * Env:
 *   NEW_FILE_COVERAGE  minimum % line coverage for new files (default 80)
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_SHA || 'origin/main';
const HEAD = process.env.HEAD_SHA || 'HEAD';
const THRESHOLD = Number(process.env.NEW_FILE_COVERAGE || 80);
const SUMMARY = 'coverage/coverage-summary.json';

const SOURCE_EXT = new Set(['.ts', '.tsx']);
const EXEMPT = [
  /\.d\.ts$/,
  /\.(test|spec)\.[tj]sx?$/,
  /(^|\/)__(tests|mocks)__\//,
  /\.config\.[tj]s$/,
  /(^|\/)(next|tailwind|postcss|jest|vitest|eslint)\.config\./,
  /(^|\/)types?\//,
  /\.types\.tsx?$/,
  // framework entrypoints — exercised by e2e, not unit tests
  /(^|\/)app\/.*\/(layout|page|loading|error|not-found|template|default|global-error)\.tsx?$/,
  /(^|\/)app\/.*\/route\.tsx?$/,
  /(^|\/)pages\//,
  /(^|\/)middleware\.tsx?$/,
  /\.stories\.tsx?$/,
];
const isSource = (f) => SOURCE_EXT.has(path.extname(f)) && !EXEMPT.some((re) => re.test(f));

function addedFiles() {
  // Only truly-added files (A) are coverage-gated; renames (R) are excluded so moving an
  // existing, already-tested file doesn't get re-judged as new and untested.
  const out = execSync(
    `git diff --name-status --diff-filter=A ${BASE}...${HEAD}`,
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return out
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t').pop())
    .filter(isSource);
}

if (!existsSync(SUMMARY)) {
  console.log(
    `::warning::${SUMMARY} not found — enable the json-summary coverage reporter to activate the diff-coverage gate. Skipping.`,
  );
  process.exit(0);
}

const raw = JSON.parse(readFileSync(SUMMARY, 'utf8'));
const cwd = process.cwd();
const cov = {};
for (const [k, v] of Object.entries(raw)) {
  if (k === 'total') continue;
  cov[path.relative(cwd, path.resolve(k))] = v; // keys are usually absolute
}

const problems = [];
for (const file of addedFiles()) {
  const entry = cov[file];
  if (!entry) {
    problems.push({ file, msg: 'no coverage data — file appears to be untested.' });
    continue;
  }
  const pct = entry.lines.pct;
  if (pct < THRESHOLD) {
    problems.push({ file, msg: `${pct}% line coverage < ${THRESHOLD}% required for new files.` });
  }
}

if (problems.length === 0) {
  console.log(`Diff coverage passed: all new files >= ${THRESHOLD}% line coverage.`);
  process.exit(0);
}

console.log(`Diff coverage: ${problems.length} new file(s) below the bar.\n`);
for (const p of problems) {
  console.log(`::error file=${p.file}::${p.msg}`);
  console.log(`  ${p.file} — ${p.msg}`);
}
process.exit(1);
