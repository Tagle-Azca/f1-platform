/** Feed/API text is untrusted: only strings and finite numbers may be rendered; everything else becomes null. */
export const safeText = (v) => {
  if (typeof v === 'string') return v
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}
export const safeString = (v, fallback = '') => {
  const t = safeText(v)
  return t === null ? fallback : String(t)
}
