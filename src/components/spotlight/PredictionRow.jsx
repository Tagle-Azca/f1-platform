import { CONFIDENCE_COLOR } from '../../utils/spotlightUtils'

function Cell({ label, children, border = true }) {
  return (
    <div style={{ padding: '0.6rem 0.75rem', borderRight: border ? '1px solid var(--border-subtle)' : 'none' }}>
      <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export default function PredictionRow({ predicted, confidence, lastPos, lastRaceName, qualiGap, mateSurname }) {
  const predColor  = predicted ? (CONFIDENCE_COLOR[confidence] ?? 'var(--accent-color)') : 'var(--text-muted)'
  const lastColor  = lastPos == null ? 'var(--text-muted)' : lastPos <= 3 ? '#22c55e' : lastPos <= 10 ? 'var(--accent-color)' : 'var(--text-secondary)'
  const deltaColor = qualiGap == null ? 'var(--text-muted)' : qualiGap < 0 ? '#22c55e' : '#e10600'
  const deltaLabel = qualiGap != null ? `${qualiGap < 0 ? '' : '+'}${qualiGap.toFixed(3)}s` : '—'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      background: 'rgba(255,255,255,0.035)', borderRadius: 8,
      overflow: 'hidden', marginBottom: '0.65rem',
    }}>
      <Cell label="Pred. Finish">
        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, color: predColor }}>
          {predicted ? `P${predicted}` : '—'}
        </div>
        {confidence && (
          <div style={{ fontSize: '0.5rem', fontWeight: 700, color: CONFIDENCE_COLOR[confidence], marginTop: 4, letterSpacing: '0.06em' }}>
            {confidence} conf.
          </div>
        )}
      </Cell>

      <Cell label="Last Race">
        <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, color: lastColor }}>
          {lastPos ? `P${lastPos}` : '—'}
        </div>
        {lastRaceName && (
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 4 }}>{lastRaceName}</div>
        )}
      </Cell>

      <Cell label="Pace Delta" border={false}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: deltaColor }}>
          {deltaLabel}
        </div>
        <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 4 }}>
          vs {mateSurname ?? 'mate'}
        </div>
      </Cell>
    </div>
  )
}
