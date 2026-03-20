import Panel from '../ui/Panel'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const SESSION_ORDER = ['fp1', 'fp2', 'sprintQualifying', 'fp3', 'sprint', 'qualifying', 'race']
const SESSION_LABELS = {
  fp1: 'Practice 1', fp2: 'Practice 2', fp3: 'Practice 3',
  sprintQualifying: 'Sprint Qualifying', sprint: 'Sprint',
  qualifying: 'Qualifying', race: 'Race',
}
const SESSION_COLORS = {
  fp1: '#22c55e', fp2: '#22c55e', fp3: '#22c55e',
  sprintQualifying: '#f59e0b', sprint: '#f59e0b',
  qualifying: '#3b82f6', race: '#e8002d',
}

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone
export const TZ_ABBR = (() => {
  try {
    return new Date().toLocaleTimeString('en-US', { timeZone: USER_TZ, timeZoneName: 'short' })
      .split(' ').pop()
  } catch { return '' }
})()

function toDate(date, time) {
  if (!date) return null
  const t = (time || '00:00:00').replace(/Z$/i, '')
  return new Date(`${date}T${t}Z`)
}

function formatSessionDate(date, time, compact = false) {
  const d = toDate(date, time)
  if (!d || isNaN(d)) return '—'
  if (compact) {
    return d.toLocaleString('en-US', {
      timeZone: USER_TZ,
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  }
  return d.toLocaleString('en-US', {
    timeZone: USER_TZ,
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function isSessionPast(date, time) {
  const d = toDate(date, time)
  return d ? d < Date.now() : false
}

function weatherIcon(code) {
  if (code === 0)               return { icon: '☀️', label: 'Clear' }
  if (code <= 3)                return { icon: '⛅', label: 'Partly cloudy' }
  if (code <= 48)               return { icon: '🌫️', label: 'Foggy' }
  if (code <= 57)               return { icon: '🌦️', label: 'Drizzle' }
  if (code <= 67)               return { icon: '🌧️', label: 'Rain' }
  if (code <= 77)               return { icon: '❄️', label: 'Snow' }
  if (code <= 82)               return { icon: '🌦️', label: 'Showers' }
  return                               { icon: '⛈️', label: 'Storm' }
}

export default function WeekendSchedulePanel({ schedule, liveKey, nextSessionKey, weather }) {
  const { isMobile } = useBreakpoint()

  return (
    <Panel padding="none" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Weekend Schedule
        </span>
        {TZ_ABBR && (
          <span style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
            color: 'var(--text-muted)', background: 'var(--surface-3)',
            padding: '2px 7px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            <span style={{ opacity: 0.5 }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>
</span> {TZ_ABBR}
          </span>
        )}
      </div>
      <div style={{ padding: '0.5rem 0' }}>
        {schedule ? SESSION_ORDER.filter(k => schedule[k]).map(key => {
          const s = schedule[key]
          const isLive = key === liveKey
          const past   = !isLive && isSessionPast(s.date, s.time)
          const col    = SESSION_COLORS[key]
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? '0.6rem' : '1rem',
              padding: isMobile ? '0.55rem 1rem' : '0.75rem 1.25rem',
              opacity: past ? 0.4 : 1,
              borderBottom: '1px solid var(--border-subtle)',
              background: (isLive || key === nextSessionKey) && !past ? `${SESSION_COLORS[key]}08` : 'transparent',
            }}>
              <div style={{ width: 4, height: isMobile ? 32 : 42, borderRadius: 2, background: col, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 700, color: past ? 'var(--text-muted)' : '#fff' }}>
                    {SESSION_LABELS[key]}
                  </span>
                  {past && (
                    <span style={{ fontSize: '0.6rem', background: 'var(--surface-3)', color: 'var(--text-muted)', borderRadius: 3, padding: '1px 6px', fontWeight: 600 }}>
                      DONE
                    </span>
                  )}
                  {isLive && (
                    <span style={{ fontSize: '0.62rem', background: 'rgba(239,68,68,0.18)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 4, padding: '1px 8px', fontWeight: 700, letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                      LIVE
                    </span>
                  )}
                  {!isLive && !past && key === nextSessionKey && (
                    <span style={{ fontSize: '0.62rem', background: `${SESSION_COLORS[key]}33`, color: SESSION_COLORS[key], border: `1px solid ${SESSION_COLORS[key]}66`, borderRadius: 4, padding: '1px 8px', fontWeight: 700, letterSpacing: '0.06em' }}>
                      NEXT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', color: past ? 'var(--text-muted)' : 'var(--text-secondary)', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formatSessionDate(s.date, s.time, isMobile)}
                </div>
              </div>
              {/* Weather */}
              {weather?.[s.date] && !past && (() => {
                const w = weather[s.date]
                const { icon } = weatherIcon(w.code)
                return (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</div>
                    <div style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {w.tempMax}° / {w.tempMin}°
                    </div>
                    {w.precipProb > 0 && (
                      <div style={{ fontSize: '0.6rem', color: '#60a5fa', marginTop: 1 }}>
                        {w.precipProb}% rain
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        }) : (
          <p style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Schedule not available yet.
          </p>
        )}
      </div>
    </Panel>
  )
}
