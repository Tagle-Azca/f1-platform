import Panel from '../ui/Panel'
import { SESSION_ORDER, SESSION_LABELS, SESSION_COLORS } from '../../utils/sessionConfig'

export default function WeekendSchedule({ schedule }) {
  if (!schedule) return null
  const sessions = SESSION_ORDER.filter(k => schedule[k])
  if (!sessions.length) return null
  const now = new Date()

  return (
    <Panel padding="none" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Weekend Schedule
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 0 }}>
        {sessions.map((key, i) => {
          const s    = schedule[key]
          const dt   = new Date(`${s.date}T${(s.time || '00:00:00').replace(/Z$/i, '')}Z`)
          const past = dt < now
          const col  = SESSION_COLORS[key]
          const day  = dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
          const time = s.time ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
          return (
            <div
              key={key}
              style={{
                padding: '0.85rem 1.25rem',
                borderRight: i < sessions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                opacity: past ? 0.45 : 1,
                borderTop: i >= 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: col, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: past ? 'var(--text-muted)' : '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {SESSION_LABELS[key]}
                </span>
                {past && (
                  <span style={{ fontSize: '0.55rem', background: 'var(--surface-3)', color: 'var(--text-muted)', borderRadius: 3, padding: '1px 5px', fontWeight: 600 }}>DONE</span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{day}</div>
              {time && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{time} local</div>}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
