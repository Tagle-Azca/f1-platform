import { Link } from 'react-router-dom'
import Panel from '../ui/Panel'
import ResultRow from '../ui/ResultRow'
import EmptyState from '../ui/EmptyState'
import Flag from '../ui/Flag'
import { ctorColor, PODIUM_COLORS } from '../../utils/teamColors'

const POSITION_SUFFIX = { 1: 'ST', 2: 'ND', 3: 'RD' }

const SESSION_TYPE_COLORS = {
  Race:              'var(--accent-color)',
  Qualifying:        '#f5c518',
  Sprint:            'var(--accent-color)',
  'Sprint Qualifying': '#f5c518',
  FP1: 'var(--text-secondary)', FP2: 'var(--text-secondary)', FP3: 'var(--text-secondary)',
}

export default function LastSessionPanel({ session, loading, onDriverClick }) {
  if (loading) {
    return (
      <Panel accent="accent" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        <EmptyState type="loading" height={100} />
      </Panel>
    )
  }
  if (!session) {
    return (
      <Panel accent="accent" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        <EmptyState type="empty" message="No session data yet" height={100} />
      </Panel>
    )
  }

  const labelColor = SESSION_TYPE_COLORS[session.sessionType] || 'var(--accent-color)'
  const isPodiumType = session.sessionType === 'Race' || session.sessionType === 'Sprint'
  const isQualiType  = session.sessionType === 'Qualifying' || session.sessionType === 'Sprint Qualifying'
  const isPractice   = ['FP1','FP2','FP3'].includes(session.sessionType)

  return (
    <Panel accent="accent" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700,
          letterSpacing: '0.12em', color: labelColor, textTransform: 'uppercase',
        }}>
          Last {session.sessionLabel}
        </span>
        <Link
          to={`/races/${session.season}/${session.round}`}
          className="last-session-race-link"
        >
          <Flag country={session.country} />
          <span className="race-name">{session.raceName?.replace(' Grand Prix', ' GP')}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Rd {session.round}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 12, height: 12, flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </Link>
      </div>

      {/* Podium (Race / Sprint) */}
      {isPodiumType && session.podium && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.90rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4,
              background: 'rgba(255,215,0,0.1)', color: '#FFD700',
              border: '1px solid rgba(255,215,0,0.25)',
              fontFamily: "monospace",
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" fill="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
                <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
              </svg>
              Podium
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {session.podium.map(driver => {
              const suffix = POSITION_SUFFIX[driver.position] || 'TH'
              return (
                <ResultRow
                  key={driver.position}
                  position={<>{driver.position}<sup style={{ fontSize: '0.5em', verticalAlign: 'super' }}>{suffix}</sup></>}
                  name={driver.name}
                  sub={driver.constructor}
                  stat={driver.time || (driver.points ? `+${driver.points} pts` : '')}
                  color={ctorColor(driver.constructorId)}
                  isLeader={driver.position === 1}
                  showChevron={!!onDriverClick}
                  onClick={onDriverClick
                    ? () => onDriverClick({ driverId: driver.driverId, name: driver.name })
                    : undefined}
                />
              )
            })}
          </div>
          {/* Fastest lap (Race only) */}
          {session.sessionType === 'Race' && session.fastestLap && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem',
              background: 'rgba(168,85,247,0.06)',
              border: '1px solid rgba(168,85,247,0.15)',
              borderRadius: 6,
            }}>
              <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
                Fastest Lap
              </span>
              <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{session.fastestLap.name}</span>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', marginLeft: 'auto' }}>{session.fastestLap.time}</span>
            </div>
          )}
        </>
      )}

      {/* Top 5 with times (Qualifying / Sprint Qualifying) */}
      {isQualiType && session.top3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {session.top3.map((driver, i) => {
            const isPole = i === 0
            const suffix = POSITION_SUFFIX[driver.position] || 'TH'
            return (
              <div
                key={driver.driverId || i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  background: isPole ? 'rgba(245,197,24,0.06)' : 'var(--surface-2)',
                  borderRadius: 8,
                  borderLeft: `3px solid ${isPole ? '#f5c518' : (ctorColor(driver.constructorId) || '#555')}`,
                }}
              >
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '1.1rem', fontWeight: 900,
                  color: isPole ? '#f5c518' : 'var(--text-muted)',
                  width: 22, flexShrink: 0, textAlign: 'center',
                }}>
                  {driver.position}<sup style={{ fontSize: '0.45em', verticalAlign: 'super' }}>{suffix}</sup>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>{driver.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{driver.constructor}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isPole && (
                    <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#f5c518', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Pole
                    </div>
                  )}
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                    {driver.time}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No results yet (practice / results pending) */}
      {(isPractice || session.resultsPending) && !session.top3 && !session.podium && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          padding: '1.5rem 0',
        }}>
          <span style={{ fontSize: '1.6rem', opacity: 0.18 }}>⏱</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {session.resultsPending ? 'Results pending...' : `${session.sessionLabel} completed`}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {session.date && new Date(session.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      )}

      {/* Footer link */}
      {session.season && session.round && (
        <Link
          to={`/races/${session.season}/${session.round}`}
          className="last-session-footer-link"
        >
          Full results →
        </Link>
      )}
    </Panel>
  )
}
