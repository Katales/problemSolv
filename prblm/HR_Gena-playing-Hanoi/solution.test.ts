import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hanoi } from './solution.ts';

test('Base case ', () => {
  assert.equal(hanoi([1, 2, 4, 2, 3, 3, 4, 1]), 0); // [1, 2, 4, 3, 4, 3, 4, 1]
});

// Rods	nDisks	Optimal moves
// 4	    10	    49
// 5	    15	    71
// 6	    21	    97