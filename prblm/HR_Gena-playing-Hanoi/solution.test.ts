import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hanoi } from './solution.ts';

test('Base case [1, 4, 1]', () => {
  assert.equal(hanoi([1, 4, 1]), 3);
});

// Rods	nDisks	Optimal moves
// 4	    10	    49
// 5	    15	    71
// 6	    21	    97