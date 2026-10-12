// Pure layout helpers for the standings chart (no React).

/** X ticks: about 6 on compact widths (always first and last), every round up to 12 rounds, then every 2nd. */
export function xTicks(n, compact) {
  if (n <= 0) return []
  if (n === 1) return [1]
  if (compact) {
    const step = Math.max(1, Math.ceil((n - 1) / 5))
    const t = []
    for (let r = 1; r < n; r += step) t.push(r)
    // last tick would crowd the one before it: drop that one instead
    if (t.length > 1 && n - t[t.length - 1] < step / 2) t.pop()
    return [...t, n]
  }
  const step = n <= 12 ? 1 : 2
  const t = []
  for (let r = 1; r <= n; r += step) t.push(r)
  if (t[t.length - 1] !== n) t.push(n)
  return t
}

/** Position axis ticks: 1, 5, 10, 15, 20 that fit in the visible ranks. */
export function rankTicks(max) {
  return [1, 5, 10, 15, 20].filter(t => t <= max)
}

/** Points axis: top rounded up to a multiple of `step` (50 drivers, 100 constructors), with 4 to 5 ticks. */
export function pointsAxis(maxValue, step) {
  const top = Math.max(step, Math.ceil(Math.max(0, maxValue) / step) * step)
  const count = top / step
  const stride = Math.max(1, Math.ceil(count / 4))
  const ticks = []
  for (let v = 0; v <= top; v += stride * step) ticks.push(v)
  if (ticks[ticks.length - 1] !== top) ticks.push(top)
  return { top, ticks }
}

/** Spread label y positions so neighbours are at least `gap` apart, keeping the order and the bounds. */
export function spreadLabels(ys, gap, min, max) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  const out = order.map(o => Math.min(Math.max(o.y, min), max))
  for (let k = 1; k < out.length; k++) out[k] = Math.max(out[k], out[k - 1] + gap)
  const over = out.length ? out[out.length - 1] - max : 0
  if (over > 0) {
    out[out.length - 1] = max
    for (let k = out.length - 2; k >= 0; k--) out[k] = Math.min(out[k], out[k + 1] - gap)
  }
  const result = new Array(ys.length)
  order.forEach((o, k) => { result[o.i] = out[k] })
  return result
}

/** Height of the Position chart: 28px per rank for constructors, 440 for 22 drivers, and the 280px top-10 cap. */
export function positionHeight(max, { isDrivers, compact }) {
  if (!isDrivers) return Math.round(36 + max * 28)
  if (!compact) return Math.round(36 + max * 18.4)
  const rankPx = max <= 10 ? 24.4 : 24.4 - (max - 10) * 0.5
  return Math.round(36 + max * rankPx)
}
