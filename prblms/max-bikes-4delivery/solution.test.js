import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { solve } from './solution.js';

// Test cases
const cases = [
  {
    // [0]
    descr: 'Typical case 1',
    orders: [
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
    ],
    expected: 5,
  },
  {
    // [1]
    descr: 'Typical case 2',
    orders: [
      { begin: 1, end: 2 },
      { begin: 2, end: 4 },
      { begin: 2, end: 5 },
      { begin: 3, end: 4 },
      { begin: 3, end: 5 },
      { begin: 4, end: 6 },
      { begin: 4, end: 10 },
      { begin: 5, end: 6 },
      { begin: 5, end: 7 },
      { begin: 5, end: 9 },
      { begin: 6, end: 11 },
      { begin: 6, end: 12 },
      { begin: 7, end: 9 },
      { begin: 8, end: 10 },
    ],
    expected: 6,
  },

  // -- Edge cases
  {
    // [2]
    descr: 'No orders',
    orders: [],
    expected: 0,
  },
  {
    // [3]
    descr: 'Consecutive orders with a gap',
    orders: [
      { begin: 1, end: 2 },
      { begin: 2, end: 6 },
      { begin: 9, end: 11 },
    ],
    expected: 1,
  },
];

describe('Typical cases:', () => {
  for (const caseN of [0, 1]) {
    const { descr, orders, expected } = cases[caseN];
    test(descr, () => {
      assert.equal(solve(orders), expected);
    });
  }
});

describe('Edge cases:', () => {
  for (const caseN of [0, 1]) {
    const { descr, orders, expected } = cases[caseN];
    test(descr, () => {
      assert.equal(solve(orders), expected);
    });
  }
});
