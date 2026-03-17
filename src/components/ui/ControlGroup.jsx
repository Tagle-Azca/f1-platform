/**
 * ControlGroup — label + input/select vertical pair.
 * Replaces repeated `<div><label>...<select>` pattern in telemetry pages.
 *
 * Props:
 *   label     string
 *   children  ReactNode   — the actual input/select
 *   width?    number      — pixel width for the input wrapper
 */
export default function ControlGroup({ label, children, width }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span className="label">{label}</span>
      <div style={width ? { width } : undefined}>
        {children}
      </div>
    </div>
  )
}
