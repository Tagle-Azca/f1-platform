import { tzAbbr } from './timezone'

/** "Sat 10 Oct · 22:59 CST" in the given IANA time zone. */
export function formatSessionWhen(iso, tz) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const weekday = d.toLocaleString('en-US', { timeZone: tz, weekday: 'short' })
  const day     = d.toLocaleString('en-US', { timeZone: tz, day: 'numeric' })
  const month   = d.toLocaleString('en-US', { timeZone: tz, month: 'short' })
  const hhmm    = d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
  return `${weekday} ${day} ${month} · ${hhmm} ${tzAbbr(tz)}`
}

