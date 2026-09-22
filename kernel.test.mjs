import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from './kernel.mjs';

test('exact division: quotas already whole numbers', () => {
  const r = K.allocateSeats([40, 30, 20, 10], 10);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seats, [4, 3, 2, 1]);
  assert.equal(r.total, 10);
});

test('classic largest-remainder example (41/29/17/13 of 100, 10 seats)', () => {
  const r = K.allocateSeats([41, 29, 17, 13], 10);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seats, [4, 3, 2, 1]);
  assert.equal(r.seats.reduce((a, b) => a + b, 0), 10);
});

test('tied fractional remainders break by ascending index, sum stays exact', () => {
  const r = K.allocateSeats([5, 5, 5], 10);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seats, [4, 3, 3]);
  assert.equal(r.total, 10);
});

test('sum invariant holds even when total exceeds share count with repeating fractions', () => {
  const r = K.allocateSeats([1, 1, 1, 1, 1, 1, 1], 3);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seats, [1, 1, 1, 0, 0, 0, 0]);
  assert.equal(r.seats.reduce((a, b) => a + b, 0), 3);
});

test('rejects empty shares array without throwing', () => {
  const r = K.allocateSeats([], 10);
  assert.equal(r.ok, false);
  assert.equal(typeof r.why, 'string');
});

test('rejects zero-sum shares and non-integer total without throwing', () => {
  const r1 = K.allocateSeats([0, 0, 0], 5);
  assert.equal(r1.ok, false);
  const r2 = K.allocateSeats([1, 2, 3], 4.5);
  assert.equal(r2.ok, false);
  const r3 = K.allocateSeats([1, -2, 3], 4);
  assert.equal(r3.ok, false);
});

// --- boundary-pinning tests added to kill mutation survivors ---

test('a share of exactly 0 is valid input, not rejected (kills >= -> > on isFiniteNonNegNumber)', () => {
  const r = K.allocateSeats([0, 10], 4);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seats, [0, 4]);
  assert.equal(r.total, 4);
});

test('total of exactly 0 is valid and yields all-zero seats (kills < -> <= on total check)', () => {
  const r = K.allocateSeats([1, 2, 3], 0);
  assert.equal(r.ok, true);
  assert.deepEqual(r.seats, [0, 0, 0]);
  assert.equal(r.total, 0);
});

test('non-array shares is rejected without throwing, independent of length check (kills || -> &&)', () => {
  const r1 = K.allocateSeats(null, 5);
  assert.equal(r1.ok, false);
  assert.equal(typeof r1.why, 'string');
  const r2 = K.allocateSeats('not an array', 5);
  assert.equal(r2.ok, false);
  const r3 = K.allocateSeats(42, 5);
  assert.equal(r3.ok, false);
});

test('remainder clamps correctly at both ends of [0, shares.length]', () => {
  // remainder === 0 exactly: quotas already whole, nothing left to distribute
  const rZero = K.allocateSeats([2, 2], 4);
  assert.equal(rZero.ok, true);
  assert.deepEqual(rZero.seats, [2, 2]);
  assert.equal(rZero.total, 4);

  // remainder at its real mathematical max (shares.length - 1)
  const rNearMax = K.allocateSeats([1, 1, 1], 2);
  assert.equal(rNearMax.ok, true);
  assert.deepEqual(rNearMax.seats, [1, 1, 0]);
  assert.equal(rNearMax.total, 2);

  // sum invariant holds under float-wobble-prone inputs (near double precision limits)
  const rWobble = K.allocateSeats([1, 4], 9007199254740989);
  assert.equal(rWobble.ok, true);
  assert.equal(rWobble.seats.length, 2);
  assert.equal(rWobble.total, rWobble.seats.reduce((a, b) => a + b, 0));
});
