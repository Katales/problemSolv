import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hanoi } from './solution.ts';

test('basic case', () => {
  assert.equal(hanoi([1, 2, 3]), 4);
});
