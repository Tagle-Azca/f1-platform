export const TZ_OPTIONS = [
  { label: 'UTC',                           value: 'UTC' },
  { label: 'London (GMT/BST)',               value: 'Europe/London' },
  { label: 'Paris / Madrid (CET)',           value: 'Europe/Paris' },
  { label: 'Helsinki (EET)',                 value: 'Europe/Helsinki' },
  { label: 'Dubai (GST)',                    value: 'Asia/Dubai' },
  { label: 'Bahrain (AST)',                  value: 'Asia/Bahrain' },
  { label: 'Singapore (SGT)',                value: 'Asia/Singapore' },
  { label: 'Tokyo (JST)',                    value: 'Asia/Tokyo' },
  { label: 'Sydney (AEDT/AEST)',             value: 'Australia/Sydney' },
  { label: 'New York (ET)',                  value: 'America/New_York' },
  { label: 'Chicago (CT)',                   value: 'America/Chicago' },
  { label: 'Mexico City (CST)',              value: 'America/Mexico_City' },
  { label: 'Denver (MT)',                    value: 'America/Denver' },
  { label: 'Los Angeles (PT)',               value: 'America/Los_Angeles' },
  { label: 'São Paulo (BRT)',                value: 'America/Sao_Paulo' },
  { label: 'Buenos Aires (ART)',             value: 'America/Argentina/Buenos_Aires' },
]

export const TZ_LS_KEY = 'f1_tz'

export function getInitialTZ() {
  try {
    const saved = localStorage.getItem(TZ_LS_KEY)
    if (saved && TZ_OPTIONS.some(t => t.value === saved)) return saved
  } catch (_) {}
  const browser = Intl.DateTimeFormat().resolvedOptions().timeZone
  return TZ_OPTIONS.some(t => t.value === browser) ? browser : 'UTC'
}

export function saveTZ(value) {
  try { localStorage.setItem(TZ_LS_KEY, value) } catch (_) {}
}

export function tzAbbr(tz) {
  try {
    return new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' })
      .split(' ').pop()
  } catch { return tz }
}

/** Format a UTC date+time string in the given IANA timezone */
export function formatInTZ(date, time, tz, compact = false) {
  if (!date) return '—'
  const t = (time || '00:00:00').replace(/Z$/i, '')
  const d = new Date(`${date}T${t}Z`)
  if (isNaN(d)) return '—'
  if (compact) {
    return d.toLocaleString('en-US', {
      timeZone: tz,
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  }
  return d.toLocaleString('en-US', {
    timeZone: tz,
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}
