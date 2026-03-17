/**
 * CountdownDisplay — 4-unit countdown (D / H / M / S).
 * Used in Navbar (size='sm') and NextRacePage/HomePage banner (size='lg').
 *
 * Props:
 *   parts  { d: number, h: number, m: number, s: number } | null
 *   size?  'sm' | 'lg'   default 'sm'
 */
export default function CountdownDisplay({ parts, size = 'sm' }) {
  if (!parts) return null

  const digitSize  = size === 'lg' ? '2.4rem' : '1.25rem'
  const unitMinW   = size === 'lg' ? 64        : 40
  const gap        = size === 'lg' ? '0.75rem' : '0.35rem'

  const UNITS = [
    { key: 'd', label: 'Days' },
    { key: 'h', label: 'Hrs' },
    { key: 'm', label: 'Min' },
    { key: 's', label: 'Sec' },
  ]

  return (
    <div style={{ display: 'flex', gap }}>
      {UNITS.map(({ key, label }) => (
        <div key={key} className="countdown-unit" style={{ minWidth: unitMinW }}>
          <span
            className="countdown-unit__digit"
            style={{ fontSize: digitSize }}
          >
            {String(parts[key]).padStart(2, '0')}
          </span>
          <span className="countdown-unit__label">{label}</span>
        </div>
      ))}
    </div>
  )
}
