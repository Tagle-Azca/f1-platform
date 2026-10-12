/** Coarse, minute-resolution "in 2d 3h" / "in 3h 20m" / "in 12m" text for a target ISO time. */
export function formatEta(targetIso, now = Date.now()) {
  const diff = new Date(targetIso).getTime() - now
  if (!Number.isFinite(diff)) return ''
  if (diff <= 0) return 'starting'
  const m = Math.floor(diff / 60000)
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60
  if (d > 0) return `in ${d}d ${h}h`
  if (h > 0) return `in ${h}h ${mm}m`
  return `in ${mm}m`
}
