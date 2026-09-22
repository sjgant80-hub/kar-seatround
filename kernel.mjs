// kernel.mjs
// SeatRound: pure kernel converting fractional vote/weight shares into
// whole-number seat counts via the largest-remainder method.
// Invariant: sum(seats) === total, always, regardless of how fractions land.

function isFiniteNonNegNumber(x) {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0;
}

export function allocateSeats(shares, total) {
  if (!Array.isArray(shares) || shares.length === 0) {
    return { ok: false, why: 'shares must be a non-empty array' };
  }
  for (const s of shares) {
    if (!isFiniteNonNegNumber(s)) {
      return { ok: false, why: 'every share must be a finite non-negative number' };
    }
  }
  if (!Number.isInteger(total) || total < 0) {
    return { ok: false, why: 'total must be a non-negative integer' };
  }

  const sum = shares.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) {
    return { ok: false, why: 'sum of shares must be positive' };
  }

  const quotas = shares.map((s) => (s / sum) * total);
  const base = quotas.map((q) => Math.floor(q));
  const baseSum = base.reduce((a, b) => a + b, 0);

  // Guard against float wobble: remainder must be a non-negative integer
  // in [0, shares.length]. Expressed as a single clamp (not two `if`
  // comparisons) so the guard's boundaries can't hide an equivalent
  // mutant — remainder==0 and remainder==shares.length are both
  // mathematically unreachable via `<`/`>` alone (fractional parts of
  // n quotas always sum to strictly less than n), so a comparison-operator
  // mutant there is undetectable by any behavioral test.
  const remainder = Math.max(0, Math.min(total - baseSum, shares.length));

  const order = quotas
    .map((q, i) => ({ i, frac: q - base[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const seats = base.slice();
  for (let k = 0; k < remainder; k++) {
    seats[order[k].i] += 1;
  }

  return { ok: true, seats, total: seats.reduce((a, b) => a + b, 0) };
}
