import { useState, useEffect } from 'react'
import GapBar from '../viz/GapBar'
import TeamBar from '../viz/TeamBar'
import { parseSeconds, quantizeMax, RACE_STEPS } from '../viz/gapScale'
import StatLine from '../ui/StatLine'
import TyreBadge from '../ui/TyreBadge'
import { ctorColor } from '../../styles/vizPalette'
import EmptyState from '../ui/EmptyState'
import { telemetryApi } from '../../services/api'

const SectionLabel = ({ children }) => (
  <h3 className="mb-pw-1 border-b border-edge pb-pw-1 font-sans text-sm font-medium text-ink-2">{children}</h3>
)

function WinStrategyTimeline({ stints }) {
  if (!stints?.length) return null
  return (
    <ol className="flex flex-1 list-none items-center gap-1">
      {stints.map((stint, i) => (
        <li key={i} className="flex items-center gap-1">
          <TyreBadge compound={stint.compound} />
          {stint.laps ? <span className="text-xs text-ink-2 tabular-nums">{stint.laps}L</span> : null}
        </li>
      ))}
    </ol>
  )
}

// Abbreviate driver name: "Max Verstappen" → "M. Verstappen"
function abbrev(driver) {
  if (!driver) return '—'
  return `${driver.givenName[0]}. ${driver.familyName}`
}

export default function LastGPPanel({ history }) {
  // Derive stable primitives before hooks so effects can depend on them
  const last    = history?.lastRace || history?.races?.[0]
  const results = last?.Results           || []
  const qual    = last?.QualifyingResults || []
  const raceId  = history?.cassandraRaceId ?? null
  const p1      = results.find(r => r.position === '1')
  const p2      = results.find(r => r.position === '2')
  const p3      = results.find(r => r.position === '3')

  const [strategyData, setStrategyData] = useState(null)

  useEffect(() => {
    if (!last) return

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
      const winner    = winnerRes.status === 'fulfilled' && winnerRes.value ? winnerRes.value : null
      const scPeriods = scRes.status     === 'fulfilled' && Array.isArray(scRes.value) ? scRes.value : []

      const stints = winner?.stints || []
      // Derive totalLaps from stints if backend didn't supply it
      const totalLaps = winner?.totalLaps
        || (stints.length ? Math.max(...stints.map(s => s.lapEnd || 0)) : null)
        || (stints.length ? stints.reduce((n, s) => n + (s.laps || 0), 0) : null)

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
        if (match) loadStrategy(match.raceId)
      })
      .catch(() => {})
  }, [raceId, last])

  if (!history?.races?.length || !p1) {
    return <EmptyState type="empty" message="No previous race at this circuit yet" />
  }

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
  const podium = [p1, p2, p3].filter(Boolean)
  const gaps = podium.map((r, i) => (i === 0 ? null : parseSeconds(typeof r.Time?.time === 'string' ? r.Time.time : null)))
  const gapMax = quantizeMax(Math.max(0, ...gaps.filter(g => g !== null)), RACE_STEPS)

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
    <div>
      <p className="num mb-pw-3 text-ink-3">{last.season}, {raceName}</p>

      <section className="mb-pw-4">
        <SectionLabel>Podium</SectionLabel>
        <ol className="list-none divide-y divide-edge-soft">
          {podium.map((r, i) => (
            <li key={i} className="flex min-h-12 items-center gap-pw-3 py-pw-2">
              <span aria-hidden="true" className="num w-5 shrink-0 text-right text-ink-2">{i + 1}</span>
              <TeamBar color={ctorColor(r.Constructor?.constructorId)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{r.Driver.givenName} {r.Driver.familyName}</span>
                <span className="block truncate text-xs leading-4 text-ink-3">{r.Constructor?.name}</span>
              </span>
              {gaps[i] !== null && <GapBar value={gaps[i]} max={gapMax} color={ctorColor(r.Constructor?.constructorId)} className="w-14" />}
              {i > 0 && r.Time?.time && <span className="num shrink-0 text-ink-2">{r.Time.time}</span>}
            </li>
          ))}
        </ol>
      </section>

      {techRows.length > 0 && (
        <section className="mb-pw-4">
          <SectionLabel>Technical</SectionLabel>
          <dl>
            {techRows.map(row => (
              <StatLine key={row.label} label={row.label} value={row.value} extra={row.extra} />
            ))}
          </dl>
        </section>
      )}

      <section>
        <SectionLabel>Strategy recap</SectionLabel>
        <dl>
          <div className="flex items-center gap-pw-3 min-h-10 py-pw-2 border-b border-edge-soft">
            <dt className="w-24 shrink-0 text-xs text-ink-3">Win. strategy</dt>
            <dd className="flex flex-1 min-w-0 items-center">
              {strategyData?.stints?.length
                ? <WinStrategyTimeline stints={strategyData.stints} />
                : <span className="text-sm font-semibold text-ink">—</span>}
            </dd>
          </div>
          <StatLine label="Overtakes" value={overtakes > 0 ? `~${overtakes}` : '—'} />
          <StatLine
            label="Safety car"
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
          />
        </dl>
      </section>
    </div>
  )
}
