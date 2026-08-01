import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from './solution.js';

test('returns max concurrent bikes needed', () => {
  const orders = [
    { begin: 1, end: 5 },
    { begin: 3, end: 6 },
    { begin: 5, end: 10 },
    { begin: 5, end: 6 },
    { begin: 5, end: 6 },
    { begin: 5, end: 8 },
    { begin: 6, end: 8 },
    { begin: 7, end: 9 },
    { begin: 9, end: 11 },
    { begin: 10, end: 11 },
  ];

  assert.equal(solve(orders), 5); // ← replace 4 with whatever the actual expected max is
});