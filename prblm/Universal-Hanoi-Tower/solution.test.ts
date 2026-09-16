import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hanoi } from './solution.ts';

test('Test case nRods=3, nDisks=10', () => {
  assert.equal(hanoi(3, 10), 1023);
});

test('Test case nRods=4, nDisks=10', () => {
  assert.equal(hanoi(4, 10), 49);
});

test('Test case nRods=5, nDisks=15', () => {
  assert.equal(hanoi(5, 15), 71);
});

test('Test case nRods=6, nDisks=21', () => {
  assert.equal(hanoi(6, 21), 97);
});

// Rods	nDisks	Optimal moves
// 4	    10	    49
// 5	    15	    71
// 6	    21	    97