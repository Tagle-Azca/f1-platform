const pad = (n) => String(n).padStart(2, '0')
const int = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)

/** Visible groups: "1d 23h 59m" from 24h away, "23h 59m 58s" below 24h, "59m 58s" below 1h. */
export function countdownGroups(parts) {
  const d = int(parts?.d), h = int(parts?.h), m = int(parts?.m), s = int(parts?.s)
  if (d > 0) return [[String(d), 'd'], [pad(h), 'h'], [pad(m), 'm']]
  if (h > 0) return [[String(h), 'h'], [pad(m), 'm'], [pad(s), 's']]
  if (m > 0) return [[String(m), 'm'], [pad(s), 's']]
  return [[String(s), 's']]
}

/** Spoken form; updates once per minute because seconds are never included. */
export function countdownSpoken(parts) {
  const d = int(parts?.d), h = int(parts?.h), m = int(parts?.m)
  const unit = (n, one) => `${n} ${one}${n === 1 ? '' : 's'}`
  if (d > 0) return [unit(d, 'day'), unit(h, 'hour'), unit(m, 'minute')].join(' ')
  if (h > 0) return [unit(h, 'hour'), unit(m, 'minute')].join(' ')
  return unit(m, 'minute')
}
