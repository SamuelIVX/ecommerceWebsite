// StrykerJS mutation testing.
// Scoped to files changed vs the PR base (`--since` in the workflow), so it only ever
// mutates new/changed code and stays fast enough to run per-PR.
//
// Requires devDeps: @stryker-mutator/core, @stryker-mutator/vitest-runner
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  reporters: ['progress', 'clear-text', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },

  // These repos have no src/ — cover the App Router layout explicitly.
  mutate: [
    '{src,app,components,lib,hooks,utils}/**/*.{ts,tsx}',
    '!**/*.{test,spec}.{ts,tsx}',
    '!**/__tests__/**',
    '!**/*.d.ts',
    // Framework entrypoints: exercised by integration/e2e, not unit tests.
    '!**/app/**/{layout,page,loading,error,not-found,template,route}.tsx',
    '!**/middleware.ts',
  ],

  // Mutation-score gate. `break` fails the run; tune as the suites mature.
  thresholds: { high: 80, low: 60, break: 70 },

  // Don't treat changes to test files themselves as code needing mutation.
  since: { ignoreChangesInFilePatterns: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**'] },
};
