import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import TelemetrySection, { Legend, LineSwatch } from '../../telemetry/TelemetrySection'
import Select from '../../ui/Select'
import { SectionError } from '../ProfileLinks'
import { ChartSkeleton } from '../ProfileSkeleton'
import { telemetryApi } from '../../../services/api'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { paceChart, lapLabel } from './constructorProfileModel'
import { AXIS_TICK_NUM, AXIS_LINE, GRID, TOOLTIP, animationProps } from '../../../styles/chartTheme'
import { teamMark, BASE } from '../../../styles/vizPalette'
import { useReducedMotion } from '../../../styles/motion'

/** True once the sentinel is within 200px of the viewport (and for good after that); true at once without IntersectionObserver. */
function useNear(ref) {
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (near || !ref.current) return undefined
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near, ref])
  return near
}

/** Team pace for one season and race: 'loading' | 'ready' | 'empty' (no data, not an error) | 'error'. */
function usePace(teamName, season, raceId, enabled) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: '', status: 'loading', data: null })
  const key = `${teamName}|${season}|${raceId}|${attempt}`
  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    Promise.resolve().then(() => telemetryApi.getTeamPace(teamName, season, raceId || undefined)).then(
      (payload) => { if (alive) setState({ key, status: payload && typeof payload === 'object' ? 'ready' : 'empty', data: payload ?? null }) },
      () => { if (alive) setState({ key, status: 'error', data: null }) },
    )
    return () => { alive = false }
  }, [enabled, teamName, season, raceId, attempt, key])
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { ...(enabled && state.key === key ? state : { status: 'loading', data: null }), retry }
}

/**
 * Race pace: lap time per lap for the team's two drivers in ONE race (solid and dashed, same hue; the acronyms label the
 * line ends). Loads lazily when scrolled near. Coverage is thin (2026 only today), so "no data" is a plain sentence with
 * no retry, distinct from a network error.
 */
export default function TeamRacePace({ teamName, season, color }) {
  const reduced = useReducedMotion()
  const md = useMediaQuery('(min-width: 768px)')
  const xl = useMediaQuery('(min-width: 1280px)')
  const sentinel = useRef(null)
  const near = useNear(sentinel)
  const [picked, setPicked] = useState({ season, raceId: '' })
  const raceId = picked.season === season ? picked.raceId : ''
  const pace = usePace(teamName, season, raceId, near)
  const chart = useMemo(() => (pace.status === 'ready' ? paceChart(pace.data) : null), [pace.status, pace.data])
  const mark = teamMark(color, BASE.panel)
  const height = xl ? 320 : md ? 280 : 240
  const raceName = chart?.raceName
  const caption = chart && raceName ? `Lap times in the ${raceName} race. Pit laps are excluded.` : 'Lap times in a single race. Pit laps are excluded.'

  let body
  if (!near || pace.status === 'loading') body = <ChartSkeleton />
  else if (pace.status === 'error') body = <SectionError what="race pace" onRetry={pace.retry} />
  else if (!chart) body = <p className="text-sm text-ink-2">No lap data for {teamName} in {season}.</p>
  else {
    const [a, b] = chart.drivers
    const last = chart.rows.length - 1
    const label = (key) => ({ x, y, index, value }) => (index === last && Number.isFinite(value) && Number.isFinite(x) ? <text x={x + 6} y={y} dy={4} fontSize="12" fontFamily="var(--pw-mono)" fill="var(--pw-ink)">{key}</text> : null)
    body = chart.drivers.length === 0 ? (
      <p className="text-sm text-ink-2">No lap times for {teamName} in the {raceName || 'selected'} race.</p>
    ) : (
      <>
        <p className="sr-only">{`Lap times for ${chart.drivers.map((d) => d.acronym).join(' and ')} across ${chart.rows.length} laps of the ${raceName} race.`}</p>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chart.rows} margin={{ top: 12, right: 44, left: 0, bottom: 4 }} accessibilityLayer={false}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="lap" tick={AXIS_TICK_NUM} tickLine={false} axisLine={AXIS_LINE} minTickGap={12} />
              <YAxis domain={[chart.min, chart.max]} allowDataOverflow tick={AXIS_TICK_NUM} tickLine={false} axisLine={false} width={52} tickFormatter={lapLabel} />
              <Tooltip {...TOOLTIP} cursor={{ stroke: 'var(--viz-baseline)' }} labelFormatter={(l) => `Lap ${l}`} formatter={(v) => lapLabel(v)} />
              <Line type="monotone" dataKey={a.acronym} stroke={mark} strokeWidth={2} dot={false} connectNulls label={label(a.acronym)} {...animationProps(reduced, `pace-a-${pace.data?.raceId}`)} />
              {b && <Line type="monotone" dataKey={b.acronym} stroke={mark} strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls label={label(b.acronym)} {...animationProps(reduced, `pace-b-${pace.data?.raceId}`)} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </>
    )
  }

  const legend = chart?.drivers.length ? chart.drivers.map((d, i) => ({ key: d.acronym, swatch: <LineSwatch color={mark} dashed={i === 1} />, label: d.acronym })) : []
  const races = chart?.races ?? []
  const options = races.map((r) => ({ value: r.raceId, label: r.raceName }))
  const shownId = chart?.raceId || raceId
  return (
    <div ref={sentinel} className="min-w-0">
      <TelemetrySection
        id="cp-pace" title="Race pace" caption={caption}
        aside={(
          <div className="flex flex-wrap items-end gap-pw-4">
            {legend.length > 0 && <Legend items={legend} />}
            {races.length > 1 && (
              <div className="flex w-40 flex-col gap-pw-1">
                <label htmlFor="cp-pace-race" className="text-xs text-ink-2">Race</label>
                <Select id="cp-pace-race" value={shownId} onChange={(v) => setPicked({ season, raceId: v })} options={options} placeholder="Race" />
              </div>
            )}
          </div>
        )}
      >
        {body}
      </TelemetrySection>
    </div>
  )
}
