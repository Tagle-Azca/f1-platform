const STATUS_MAP = {
  'Did not start':        'DNS',
  'Did not qualify':      'DNQ',
  'Did not prequalify':   'DNPQ',
  'Disqualified':         'DSQ',
  'Excluded':             'DSQ',
  'Withdrew':             'WD',
  'Not classified':       'NC',
  'Accident':             'DNF',
  'Collision':            'DNF',
  'Collision damage':     'DNF',
  'Retired':              'DNF',
  'Mechanical':           'DNF',
  'Engine':               'DNF',
  'Gearbox':              'DNF',
  'Transmission':         'DNF',
  'Hydraulics':           'DNF',
  'Electrical':           'DNF',
  'Spun off':             'DNF',
  'Brakes':               'DNF',
  'Suspension':           'DNF',
  'Tyre':                 'DNF',
  'Puncture':             'DNF',
  'Wheel':                'DNF',
  'Power Unit':           'DNF',
  'ERS':                  'DNF',
  'Overheating':          'DNF',
  'Oil pressure':         'DNF',
  'Water pressure':       'DNF',
  'Water leak':           'DNF',
  'Fuel pressure':        'DNF',
  'Fuel system':          'DNF',
  'Fire':                 'DNF',
  'Driver Seat':          'DNF',
  'Debris':               'DNF',
}

export function abbreviateStatus(status) {
  if (!status) return '—'
  if (status === 'Finished' || status.startsWith('+')) return status
  return STATUS_MAP[status] || status.length > 10 ? (STATUS_MAP[status] || 'DNF') : status
}

export default function StatusBadge({ status }) {
  const label    = abbreviateStatus(status)
  const finished = status === 'Finished' || status?.startsWith('+')
  const isDNF    = label === 'DNF' || label === 'DNS' || label === 'DNQ' || label === 'DSQ'
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.45rem',
      borderRadius: 4, whiteSpace: 'nowrap',
      background: finished ? 'rgba(34,197,94,0.1)' : isDNF ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
      color: finished ? '#22c55e' : isDNF ? '#ef4444' : 'var(--text-muted)',
      border: `1px solid ${finished ? 'rgba(34,197,94,0.2)' : isDNF ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      {label}
    </span>
  )
}
