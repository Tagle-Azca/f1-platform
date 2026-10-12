/**
 * Validators for API-sourced values that end up in `src`, `href` or CSS variables.
 * Anything that fails validation returns null so callers can omit the attribute.
 */

/** Returns the URL string only if it parses and uses https:. */
export function safeHttpsUrl(value) {
  if (typeof value !== 'string') return null
  try {
    const u = new URL(value)
    return u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}

/** Returns a CSS color only if it is a plain hex (#rgb, #rrggbb, #rrggbbaa); otherwise null. */
export function safeColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? value : null
}
