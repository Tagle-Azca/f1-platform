import { useState, useEffect } from 'react'
import Panel from '../ui/Panel'
import { ctorColor } from '../../utils/teamColors'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { telemetryApi } from '../../services/api'

const PODIUM_MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32']

const sectionLabelStyle = {
  fontSize: '0.57rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.25rem',
  paddingBottom: '0.3rem',
  borderBottom: '1px solid var(--border-color)',
}

function PodiumRow({ result, pos }) {
  const medal     = PODIUM_MEDALS[pos - 1]
  const teamColor = ctorColor(result.Constructor?.constructorId)
  const name      = `${result.Driver.givenName} ${result.Driver.familyName}`
  const isLast    = pos === 3

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.55rem',
      padding: '0.42rem 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.88rem',
        fontWeight: 900,
        color: medal,
        width: 14,
        textAlign: 'right',
        flexShrink: 0,
        lineHeight: 1,
      }}>
        {pos}
      </span>
      <div style={{ width: 3, height: 28, borderRadius: 2, background: teamColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.25,
        }}>
          {name}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>
          {result.Constructor?.name}
        </div>
      </div>
    </div>
  )
}

function TechRow({ label, value, extra, ctor, dimExtra = true, last = false }) {
  const valueColor = ctor ? ctorColor(ctor) : '#fff'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      padding: '0.38rem 0',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
    }}>
      {/* Fixed-width label */}
      <span style={{
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        flexShrink: 0,
        width: 54,
      }}>
        {label}
      </span>
      {/* Value — grows to fill, keeps time anchored to the right */}
      <span style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: valueColor,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingLeft: '0.5rem',
      }}>
        {value}
      </span>
      {/* Time/extra — always pinned to the right edge */}
      {extra && (
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: dimExtra ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.6)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
          flexShrink: 0,
          marginLeft: 'auto',
          paddingLeft: '0.75rem',
        }}>
          {extra}
        </span>
      )}
    </div>
  )
}

function RecapRow({ label, value, last = false }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      padding: '0.38rem 0',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
    }}>
      <span style={{
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        flexShrink: 0,
        width: 76,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#fff',
        paddingLeft: '0.5rem',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.03em',
      }}>
        {value}
      </span>
    </div>
  )
}

const COMPOUND_ABBR  = { SOFT: 'S', MEDIUM: 'M', HARD: 'H', INTERMEDIATE: 'I', WET: 'W' }
const COMPOUND_COLOR = { SOFT: '#ef4444', MEDIUM: '#eab308', HARD: '#e5e7eb', INTERMEDIATE: '#22c55e', WET: '#3b82f6' }

// Abbreviate driver name: "Max Verstappen" → "M. Verstappen"
function abbrev(driver) {
  if (!driver) return '—'
  return `${driver.givenName[0]}. ${driver.familyName}`
}

export default function LastGPPanel({ history }) {
  const { isMobile } = useBreakpoint()

  // Derive stable primitives before hooks so effects can depend on them
  const last    = history?.lastRace || history?.races?.[0]
  const results = last?.Results           || []
  const qual    = last?.QualifyingResults || []
  const raceId  = last?.season && last?.round ? `${last.season}_${last.round}` : null
  const p1      = results.find(r => r.position === '1')
  const p2      = results.find(r => r.position === '2')
  const p3      = results.find(r => r.position === '3')
  const p1num   = parseInt(p1?.Driver?.permanentNumber)

  const [strategyData, setStrategyData] = useState(null)

  useEffect(() => {
    if (!raceId) return
    Promise.allSettled([
      telemetryApi.getTireStrategy(raceId),
      telemetryApi.getSafetyCar(raceId),
    ]).then(([stratRes, scRes]) => {
      const strategy  = stratRes.status === 'fulfilled' && Array.isArray(stratRes.value) ? stratRes.value : []
      const scPeriods = scRes.status   === 'fulfilled' && Array.isArray(scRes.value)   ? scRes.value   : []

      const winnerEntry = !isNaN(p1num) ? strategy.find(s => s.driverId === p1num) : null
      const compounds   = winnerEntry?.stints?.length
        ? winnerEntry.stints.map(s => s.compound?.toUpperCase() || 'UNKNOWN')
        : []

      const scCount  = scPeriods.filter(p => p.type === 'SC').length
      const vscCount = scPeriods.filter(p => p.type === 'VSC').length

      setStrategyData({ compounds, scCount, vscCount })
    })
  }, [raceId])

  if (!history?.races?.length) return null
  if (!p1) return null

  // ── Pole position ─────────────────────────────────────
  // Primary source: QualifyingResults (from Jolpica qualifying.json)
  // Fallback: Results[grid === '1'] — same person, no lap time but avoids blank row
  const poleFromQuali = qual.find(r => r.position === '1')
  const poleTime      = poleFromQuali?.Q3 ?? poleFromQuali?.Q2 ?? poleFromQuali?.Q1 ?? null
  const poleResult    = poleFromQuali
    ?? results.find(r => r.grid === '1')   // fallback: race grid position

  // ── Fastest lap ───────────────────────────────────────
  // Primary: rank field (Jolpica stores it as string "1" or number 1 depending on the year)
  let fastest = results.find(r => r.FastestLap?.rank != null && String(r.FastestLap.rank) === '1')

  // Fallback: if rank is missing (some seeds/years don't include it), find the driver
  // with the shortest FastestLap.Time.time by parsing the "m:ss.mmm" format directly.
  if (!fastest) {
    const parseLapTime = t => {
      if (!t) return Infinity
      const [min, sec] = t.split(':')
      return parseFloat(min) * 60 + parseFloat(sec)
    }
    const withTime = results.filter(r => r.FastestLap?.Time?.time)
    if (withTime.length) {
      fastest = withTime.reduce((best, r) =>
        parseLapTime(r.FastestLap.Time.time) < parseLapTime(best.FastestLap.Time.time) ? r : best
      )
    }
  }

  const fastestTime = fastest?.FastestLap?.Time?.time ?? null

  // ── DNFs ──────────────────────────────────────────────
  const dnfs = results.filter(r => {
    const s = r.status || ''
    return s !== 'Finished' && !/^\+\d+/.test(s)
  })

  // ── Overtakes (sum of net position gains by all finishers) ─
  const overtakes = results.reduce((sum, r) => {
    const g = parseInt(r.grid)
    const f = parseInt(r.position)
    return (!isNaN(g) && !isNaN(f) && g > f) ? sum + (g - f) : sum
  }, 0)

  const raceName = last.raceName?.replace(' Grand Prix', ' GP') ?? '—'

  // Build technical rows — only include rows where we have a value
  const techRows = [
    poleResult ? {
      label: 'Pole',
      value: abbrev(poleResult.Driver),
      extra: poleTime,                          // null if only fallback → nothing shown on right
      ctor:  poleResult.Constructor?.constructorId,
    } : null,
    fastest ? {
      label: 'Fastest',
      value: abbrev(fastest.Driver),
      extra: fastestTime,
      ctor:  fastest.Constructor?.constructorId,
    } : null,
    dnfs.length > 0 ? {
      label: 'DNFs',
      value: String(dnfs.length),
      extra: dnfs.slice(0, 2).map(r => r.Driver.familyName).join(' · '),
      ctor:  null,
    } : null,
  ].filter(Boolean)

  return (
    <Panel
      padding="none"
      style={{
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.25rem',
        height: isMobile ? 'auto' : '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '0.85rem',
      }}>
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Last time here
        </span>
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {last.season} · {raceName}
        </span>
      </div>

      {/* ── Podium ── */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={sectionLabelStyle}>Podium</div>
        {[p1, p2, p3].filter(Boolean).map((r, i) => (
          <PodiumRow key={i} result={r} pos={i + 1} />
        ))}
      </div>

      {/* ── Technical ── */}
      {techRows.length > 0 && (
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={sectionLabelStyle}>Technical</div>
          {techRows.map((row, i) => (
            <TechRow
              key={row.label}
              label={row.label}
              value={row.value}
              extra={row.extra}
              ctor={row.ctor}
              last={i === techRows.length - 1}
            />
          ))}
        </div>
      )}

      {/* ── Strategy Recap ── */}
      <div>
        <div style={sectionLabelStyle}>Strategy Recap</div>
        <RecapRow
          label="Win. Strategy"
          value={
            strategyData?.compounds?.length
              ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.18rem' }}>
                  {strategyData.compounds.map((c, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.18rem' }}>
                      {i > 0 && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', fontWeight: 400 }}>→</span>}
                      <span style={{ color: COMPOUND_COLOR[c] || '#fff', fontWeight: 900 }}>
                        {COMPOUND_ABBR[c] || '?'}
                      </span>
                    </span>
                  ))}
                </span>
              )
              : '—'
          }
        />
        <RecapRow
          label="Overtakes"
          value={overtakes > 0 ? `~${overtakes}` : '—'}
        />
        <RecapRow
          label="Safety Car"
          value={
            strategyData
              ? (strategyData.scCount === 0 && strategyData.vscCount === 0)
                ? 'None'
                : [
                    strategyData.scCount  > 0 ? `${strategyData.scCount} SC`  : null,
                    strategyData.vscCount > 0 ? `${strategyData.vscCount} VSC` : null,
                  ].filter(Boolean).join(' / ')
              : '—'
          }
          last
        />
      </div>

      <div style={{ flex: 1 }} />
    </Panel>
  )
}
