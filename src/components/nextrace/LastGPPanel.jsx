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
const COMPOUND_COLOR = { SOFT: '#e10600', MEDIUM: '#F5DA0B', HARD: '#C0C0C0', INTERMEDIATE: '#22c55e', WET: '#3b82f6' }

function WinStrategyTimeline({ stints }) {
  if (!stints?.length) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
      {stints.map((stint, i) => {
        const color = COMPOUND_COLOR[stint.compound] || '#555'
        const abbr  = COMPOUND_ABBR[stint.compound]  || '?'
        const tip   = stint.laps ? `${abbr} · ${stint.laps} laps` : abbr
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && (
              <div style={{ width: 8, height: 1, background: 'var(--border-subtle)', flexShrink: 0 }} />
            )}
            <div
              title={tip}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2.5px solid ${color}`,
                background: 'var(--surface-1, #0f0f0f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'default',
              }}
            >
              <span style={{
                fontSize: '0.5rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color,
                lineHeight: 1,
                userSelect: 'none',
              }}>
                {abbr}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

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
  const raceId  = history?.cassandraRaceId ?? null
  const p1      = results.find(r => r.position === '1')
  const p2      = results.find(r => r.position === '2')
  const p3      = results.find(r => r.position === '3')
  const p1num   = parseInt(p1?.Driver?.permanentNumber)

  const [strategyData, setStrategyData] = useState(null)

  useEffect(() => {
    console.log('[LastGP] effect ran — last:', last?.raceName, '| season:', last?.season, '| raceId:', raceId, '| p1num:', p1num)
    if (!last) { console.warn('[LastGP] last is null/undefined — aborting'); return }

    const season   = String(last.season ?? '')
    const raceName = last.raceName ?? ''
    const locality = last.Circuit?.Location?.locality ?? ''
    const norm     = s => s.toLowerCase().replace(/grand prix/i, '').trim()
    const needleName = norm(raceName)
    const needleLoc  = norm(locality)

    async function loadStrategy(targetRaceId) {
      const [winnerRes, scRes] = await Promise.allSettled([
        telemetryApi.getWinnerStrategy(targetRaceId),
        telemetryApi.getSafetyCar(targetRaceId),
      ])
      if (winnerRes.status === 'rejected')
        console.warn('[LastGP] getWinnerStrategy failed:', winnerRes.reason?.message)
      const winner    = winnerRes.status === 'fulfilled' && winnerRes.value ? winnerRes.value : null
      const scPeriods = scRes.status     === 'fulfilled' && Array.isArray(scRes.value) ? scRes.value : []

      const stints = winner?.stints || []
      // Derive totalLaps from stints if backend didn't supply it
      const totalLaps = winner?.totalLaps
        || (stints.length ? Math.max(...stints.map(s => s.lapEnd || 0)) : null)
        || (stints.length ? stints.reduce((n, s) => n + (s.laps || 0), 0) : null)

      console.log('[LastGP] raceId:', targetRaceId, '| winner:', winner?.acronym, '| stints:', stints.length, '| totalLaps:', totalLaps)

      const scCount  = scPeriods.filter(p => p.type === 'SC').length
      const vscCount = scPeriods.filter(p => p.type === 'VSC').length
      setStrategyData({ stints, totalLaps, scCount, vscCount })
    }

    // Fast path: backend already resolved the Cassandra race ID
    if (raceId) {
      loadStrategy(raceId)
      return
    }

    // Fallback: match by name only across all available years, pick most recent
    telemetryApi.getAvailableRaces()
      .then(available => {
        const candidates = available.filter(r => {
          const hay = norm(r.raceName || '')
          return (
            (needleName.length >= 4 && hay && (hay.includes(needleName.slice(0, 5)) || needleName.includes(hay.slice(0, 5)))) ||
            (needleLoc.length  >= 4 && hay && (hay.includes(needleLoc.slice(0,  4)) || needleLoc.includes(hay.slice(0,  4))))
          )
        })
        // Sort by year desc → pick most recent available race at this circuit
        const match = candidates.sort((a, b) => {
          const ya = parseInt(a.raceId.split('_')[0]) || 0
          const yb = parseInt(b.raceId.split('_')[0]) || 0
          return yb - ya
        })[0] ?? null
        console.log('[LastGP] fallback match:', match?.raceId ?? 'none', '| needle:', needleName, '| loc:', needleLoc)
        if (match) loadStrategy(match.raceId)
      })
      .catch(() => {})
  }, [raceId, last?.season, last?.raceName])

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

  // ── DNF / DNS — race results only ─────────────────────
  const isFinished = r => {
    const s = r.status || ''
    return s === 'Finished' || /^\+\d+\s*Lap/.test(s)
  }
  const isDNS = r => {
    const s = (r.status || '').toLowerCase()
    return s.includes('did not start') || s === 'dns' || s.includes('withdrew') || r.grid === '0'
  }
  const dnfs = results.filter(r => !isFinished(r) && !isDNS(r))
  const dnss = results.filter(r => isDNS(r))

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
    dnfs.length > 0 ? { label: 'DNF', value: String(dnfs.length), extra: null, ctor: null } : null,
    dnss.length > 0 ? { label: 'DNS', value: String(dnss.length), extra: null, ctor: null } : null,
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
        {/* ── Win Strategy timeline ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.38rem 0',
          borderBottom: '1px solid var(--border-subtle)',
          gap: '0.5rem',
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
            Win. Strategy
          </span>
          {strategyData?.stints?.length
            ? <WinStrategyTimeline stints={strategyData.stints} />
            : <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', paddingLeft: '0.5rem' }}>—</span>
          }
        </div>
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
