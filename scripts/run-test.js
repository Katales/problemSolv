import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const target = process.argv[2];

if (!target) {
  console.error('Usage: npm test -- <path-to-problem-folder-or-test-file>');
  process.exit(1);
}

function resolveTestFile(path) {
  if (!existsSync(path)) {
    console.error(`Path not found: ${path}`);
    process.exit(1);
  }

  if (statSync(path).isFile()) return path; // already points at a file

  // it's a directory — look for a solution.test.{ts,js} inside it
  for (const ext of ['ts', 'js']) {
    const candidate = join(path, `solution.test.${ext}`);
    if (existsSync(candidate)) return candidate;
  }

  console.error(`No solution.test.ts or solution.test.js found in ${path}`);
  process.exit(1);
}

const testFile = resolveTestFile(target);

const result = spawnSync('node', ['--import', 'tsx', '--test', testFile], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
