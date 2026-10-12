/** Fallback 3-letter driver code from a full name, for rows the API doesn't tag with a `code`. */
export function codeFromName(name) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  const last = parts[parts.length - 1]
  return last.slice(0, 3).toUpperCase()
}
