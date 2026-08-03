import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from './solution.ts';

test('basic case', () => {
  assert.equal(solve('example'), 'expected');
});
