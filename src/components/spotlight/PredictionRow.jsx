import { CONFIDENCE_COLOR } from '../../utils/spotlightUtils'

function Cell({ label, children, border = true, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '0.45rem 0.5rem' : '0.6rem 0.75rem', borderRight: border ? '1px solid var(--border-subtle)' : 'none' }}>
      <div style={{ fontSize: isMobile ? '0.45rem' : '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: isMobile ? 3 : 5 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export default function PredictionRow({ predicted, confidence, lastPos, lastRaceName, qualiGap, mateSurname, isMobile }) {
  const predColor  = predicted ? (CONFIDENCE_COLOR[confidence] ?? 'var(--accent-color)') : 'var(--text-muted)'
  const lastColor  = lastPos == null ? 'var(--text-muted)' : lastPos <= 3 ? '#22c55e' : lastPos <= 10 ? 'var(--accent-color)' : 'var(--text-secondary)'
  const deltaColor = qualiGap == null ? 'var(--text-muted)' : qualiGap < 0 ? '#22c55e' : '#e10600'
  const deltaLabel = qualiGap != null ? `${qualiGap < 0 ? '' : '+'}${qualiGap.toFixed(3)}s` : '—'

  const valSize   = isMobile ? '1.15rem' : '1.5rem'
  const subSize   = isMobile ? '0.42rem' : '0.5rem'
  const deltaSize = isMobile ? '0.95rem' : '1.25rem'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      background: 'rgba(255,255,255,0.035)', borderRadius: 8,
      overflow: 'hidden', marginBottom: isMobile ? '0.5rem' : '0.65rem',
    }}>
      <Cell label="Pred. Finish" isMobile={isMobile}>
        <div style={{ fontSize: valSize, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, color: predColor }}>
          {predicted ? (predicted === 10 ? 'P10+' : `P${predicted}`) : '—'}
        </div>
        {confidence && (
          <div style={{ fontSize: subSize, fontWeight: 700, color: CONFIDENCE_COLOR[confidence], marginTop: 3, letterSpacing: '0.06em' }}>
            {confidence} conf.
          </div>
        )}
      </Cell>

      <Cell label="Last Race" isMobile={isMobile}>
        <div style={{ fontSize: valSize, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, color: lastColor }}>
          {lastPos ? `P${lastPos}` : '—'}
        </div>
        {lastRaceName && (
          <div style={{ fontSize: subSize, color: 'var(--text-muted)', marginTop: 3 }}>{lastRaceName}</div>
        )}
      </Cell>

      <Cell label="Pace Delta" border={false} isMobile={isMobile}>
        <div style={{ fontSize: deltaSize, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: deltaColor }}>
          {deltaLabel}
        </div>
        <div style={{ fontSize: subSize, color: 'var(--text-muted)', marginTop: 3 }}>
          vs {mateSurname ?? 'mate'}
        </div>
      </Cell>
    </div>
  )
}
