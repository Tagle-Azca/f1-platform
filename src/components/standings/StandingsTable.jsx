import { LEGENDARY, SEASON_STORIES, PODIUM_COLORS } from '../../utils/teamColors'
import Panel from '../ui/Panel'
import ResultRow from '../ui/ResultRow'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function StandingsTable({ currentStandings, currentRound, season, loading, onDriverClick }) {
  const { isMobile } = useBreakpoint()
  const twoCol = !isMobile && currentStandings.length > 12
  const half   = Math.ceil(currentStandings.length / 2)
  const col1   = currentStandings.slice(0, half)
  const col2   = currentStandings.slice(half)

  function makeRow(d, globalIdx) {
    const prev      = currentStandings[globalIdx - 1]
    const gapToPrev = prev ? prev.pts - d.pts : null
    return (
      <ResultRow
        key={d.driverId}
        position={globalIdx + 1}
        name={
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            {!twoCol && d.number && (
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.68rem', fontWeight: 700,
                color: d.color, opacity: 0.8, flexShrink: 0,
              }}>
                #{d.number}
              </span>
            )}
            {d.name.split(' ').pop()}
          </span>
        }
        sub={d.team}
        stat={
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ display: 'block' }}>{d.pts}</span>
            {gapToPrev !== null && gapToPrev > 0 && (
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                -{gapToPrev}
              </span>
            )}
          </span>
        }
        color={d.color}
        podiumColor={PODIUM_COLORS[globalIdx] ?? null}
        isLeader={false}
        compact
        onClick={onDriverClick ? () => onDriverClick({ driverId: d.driverId, name: d.name }) : undefined}
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 0,
          paddingLeft: 0,
          paddingRight: twoCol ? '0.25rem' : 0,
        }}
      />
    )
  }

  return (
    <div style={{ width: isMobile ? '100%' : (twoCol ? 420 : 220), flexShrink: 0 }}>
      <Panel padding="none" className="card">
        <div style={{ padding: '0.85rem 1rem' }}>
          <div className="table-header" style={{ marginBottom: '0.6rem' }}>
            STANDINGS{currentRound ? ` · ${currentRound.raceName}` : ''}
          </div>

          {twoCol ? (
            /* ── Two-column layout ─────────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.25rem' }}>
              <div>
                {col1.map((d, i) => makeRow(d, i))}
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '0.25rem' }}>
                {col2.map((d, i) => makeRow(d, half + i))}
              </div>
            </div>
          ) : (
            /* ── Single-column layout ──────────────────── */
            currentStandings.map((d, i) => makeRow(d, i))
          )}

          {!currentStandings.length && !loading && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No data</p>
          )}
        </div>
      </Panel>

      {LEGENDARY.has(season) && (
        <Panel padding="sm" className="card" style={{ marginTop: '0.75rem' }}>
          <div className="table-header" style={{ marginBottom: '0.4rem' }}>
            LEGENDARY SEASON
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {SEASON_STORIES[season] || 'One of the most epic seasons in F1 history.'}
          </p>
        </Panel>
      )}
    </div>
  )
}
