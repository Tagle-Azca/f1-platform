/** Convert YYYY-MM-DD → DD/MM/YYYY */
export function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/** Format a Date object → DD/MM/YYYY */
export function fmtDateObj(date) {
  if (!date) return ''
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

/** Format ISO date + optional time → "Mon DD/MM/YYYY" or "Mon DD/MM" */
export function fmtSessionDate(iso, time) {
  if (!iso) return ''
  const dt = new Date(`${iso}T${time || '00:00:00'}Z`)
  const weekday = dt.toLocaleDateString('en-GB', { weekday: 'short' })
  const d = String(dt.getDate()).padStart(2, '0')
  const mo = String(dt.getMonth() + 1).padStart(2, '0')
  const yr = dt.getFullYear()
  return `${weekday} ${d}/${mo}/${yr}`
}
