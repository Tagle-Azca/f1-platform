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
