export const STATUS_COLOR = {
  Accident: '#ef4444', Collision: '#ef4444', Spun: '#f97316',
  'Power Unit': '#a855f7', Engine: '#a855f7', Mechanical: '#a855f7',
  Gearbox: '#a855f7', Hydraulics: '#a855f7', Electrical: '#a855f7',
  Brakes: '#f59e0b', Retired: '#888', Disqualified: '#ef4444',
  'Did not': '#888',
}

export function statusColor(s) {
  const key = Object.keys(STATUS_COLOR).find(k => s?.includes(k))
  return key ? STATUS_COLOR[key] : '#888'
}

export function isFinished(status) {
  return status === 'Finished' || status?.startsWith('+')
}

const DNS_KEYS = ['Did not start', 'Withdrew', 'Did not qualify', 'Not classified']

/**
 * Classify a race finishing status.
 * Returns: 'finished' | 'lapped' | 'dnf' | 'dns' | 'unknown'
 *
 * 'finished' — crossed the line at full distance
 * 'lapped'   — completed the race but down one or more laps (e.g. "+1 Lap", "+2 Laps")
 * 'dnf'      — retired before the checkered flag (mechanical, accident, etc.)
 * 'dns'      — did not start / not classified
 * 'unknown'  — status unavailable
 */
export function getRaceStatus(statusText) {
  if (!statusText) return 'unknown'
  if (statusText === 'Finished') return 'finished'
  if (statusText.startsWith('+') || statusText.includes('Lap')) return 'lapped'
  if (DNS_KEYS.some(k => statusText.includes(k))) return 'dns'
  return 'dnf'
}
