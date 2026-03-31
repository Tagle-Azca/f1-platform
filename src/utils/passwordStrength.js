// Industry-standard password strength (NIST SP 800-63B / OWASP guidelines)
// Length is the primary factor; complexity is secondary.

export function getChecks(pw) {
  return {
    length:  pw.length >= 8,
    letter:  /[a-zA-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    upper:   /[A-Z]/.test(pw),
    special: /[^a-zA-Z0-9]/.test(pw),
    long:    pw.length >= 12,
  }
}

// Returns 0-4. 0 = too short / missing required chars.
export function getStrength(pw) {
  if (!pw) return 0
  const c = getChecks(pw)
  // Minimum requirements not met → always 0
  if (!c.length || !c.letter || !c.number) return 0

  const bonus = [c.upper, c.special, c.long].filter(Boolean).length
  if (bonus === 0) return 1 // WEAK
  if (bonus === 1) return 2 // FAIR
  if (bonus === 2) return 3 // GOOD
  return 4                   // STRONG
}

// Returns null if valid, or an error string for hard requirements.
export function validatePassword(pw) {
  if (!pw || pw.length < 8)  return 'Must be at least 8 characters'
  if (!/[a-zA-Z]/.test(pw)) return 'Must contain at least one letter'
  if (!/[0-9]/.test(pw))    return 'Must contain at least one number'
  return null
}

export const STRENGTH_META = [
  null,
  { label: 'WEAK',   color: '#ef4444' },
  { label: 'FAIR',   color: '#f59e0b' },
  { label: 'GOOD',   color: '#22c55e' },
  { label: 'STRONG', color: '#22c55e' },
]
