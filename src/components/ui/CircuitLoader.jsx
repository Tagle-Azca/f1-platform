import CircuitSilhouette from '../circuit/CircuitSilhouette'

// Monaco circuit GPS coordinates — hardcoded so this renders with zero network requests
const MONACO_COORDS = [
  [7.4274, 43.7347],
  [7.4268, 43.7340],
  [7.4262, 43.7336],
  [7.4254, 43.7337],
  [7.4244, 43.7342],
  [7.4235, 43.7349],
  [7.4227, 43.7355],
  [7.4219, 43.7356],
  [7.4214, 43.7353],
  [7.4213, 43.7348],
  [7.4215, 43.7342],
  [7.4214, 43.7335],
  [7.4210, 43.7330],
  [7.4207, 43.7334],
  [7.4207, 43.7339],
  [7.4210, 43.7343],
  [7.4215, 43.7345],
  [7.4224, 43.7345],
  [7.4235, 43.7344],
  [7.4246, 43.7342],
  [7.4251, 43.7339],
  [7.4254, 43.7336],
  [7.4258, 43.7337],
  [7.4264, 43.7337],
  [7.4268, 43.7337],
  [7.4272, 43.7338],
  [7.4276, 43.7341],
  [7.4278, 43.7345],
  [7.4277, 43.7349],
  [7.4273, 43.7352],
  [7.4270, 43.7351],
  [7.4271, 43.7349],
  [7.4274, 43.7347],
]

/**
 * CircuitLoader — Monaco circuit animation used as loading indicator.
 * Renders instantly (hardcoded coords, pure SVG — no network requests).
 *
 * Props:
 *   message?  string   — label below the circuit (default 'Loading...')
 *   size?     'sm'|'md'|'lg'  — controls dimensions (default 'md')
 *   height?   number   — outer container min-height (default 220)
 */
export default function CircuitLoader({ message = 'Loading...', size = 'md', height = 220 }) {
  const dims = {
    sm: { w: 110, h: 70  },
    md: { w: 160, h: 100 },
    lg: { w: 220, h: 140 },
  }[size] || { w: 160, h: 100 }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.75rem', minHeight: height,
    }}>
      <CircuitSilhouette
        coords={MONACO_COORDS}
        color="var(--f1-red)"
        width={dims.w}
        height={dims.h}
        strokeWidth={2}
        animate
      />
      {message && (
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
          animation: 'pulse-dot 1.8s ease-in-out infinite',
        }}>
          {message}
        </span>
      )}
    </div>
  )
}
