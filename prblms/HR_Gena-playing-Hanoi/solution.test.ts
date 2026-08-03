import assert from 'node:assert/strict';
import { test } from 'node:test';
import { solve } from './solution.ts';

test('basic case', () => {
  assert.equal(solve('example'), 'expected');
});
