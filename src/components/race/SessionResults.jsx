import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Panel from '../ui/Panel'
import SegmentedControl from '../ui/SegmentedControl'
import SessionTable from './SessionTable'
import PracticePanel from './PracticePanel'
import { qualiRows, raceRows, snapshotRows } from './resultsModel'
import { pickSession, sessionOptions, SESSION_LABEL } from './weekendModel'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../styles/motion'
import { cn } from '@/lib/utils'

const PARAM = 'session'
const OPTION_ROW = 'flex snap-x overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible'

function SnapshotNote({ snapshot, pending }) {
  const saved = snapshot?.savedAt ? new Date(snapshot.savedAt) : null
  const time = saved && !Number.isNaN(saved.getTime()) ? saved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <p className="flex flex-wrap items-center gap-x-pw-3 gap-y-pw-1 px-pw-3 py-pw-2 text-xs text-ink-2">
      <span>Live timing classification{time ? <>, saved <span className="num">{time}</span></> : ''}</span>
      {pending && <span className="text-signal-yellow">Official results pending</span>}
    </p>
  )
}

/**
 * Session results of a weekend: a tablist of the sessions that have data (sprint-aware) and the matching table.
 * The selected session is `?session=` (missing = Race, or Qualifying without a race result); a choice pushes.
 */
export default function SessionResults({ race, season, round, now, onDriverClick }) {
  const wide = useMediaQuery('(min-width: 768px)')
  const reduced = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const options = useMemo(() => sessionOptions(race, now), [race, now])
  const active = pickSession(params.get(PARAM), options)
  const [entrance, setEntrance] = useState(true)
  useEffect(() => { const t = setTimeout(() => setEntrance(false), 1500); return () => clearTimeout(t) }, [])

  if (!options.length || !active) return null

  function choose(value) {
    const next = new URLSearchParams(params)
    if (value === pickSession(null, options)) next.delete(PARAM); else next.set(PARAM, value)
    setParams(next)
  }

  const results = race.Results ?? []
  let body = null
  if (active === 'race') {
    body = results.length
      ? <SessionTable kind="race" rows={raceRows(results)} wide={wide} label="Race classification" onDriverClick={onDriverClick} entrance={entrance} reduced={reduced} />
      : <><SnapshotNote snapshot={race.raceSnapshot} pending /><SessionTable kind="snapshot" rows={snapshotRows(race.raceSnapshot)} wide={wide} label="Race classification from live timing" lastLabel="Gap" /></>
  } else if (active === 'quali') {
    body = (race.QualifyingResults ?? []).length
      ? <SessionTable kind="quali" rows={qualiRows(race.QualifyingResults)} wide={wide} label="Qualifying classification" onDriverClick={onDriverClick} entrance={entrance} reduced={reduced} />
      : <><SnapshotNote snapshot={race.qualifyingSnapshot} /><SessionTable kind="snapshot" rows={snapshotRows(race.qualifyingSnapshot, { column: 'bestLap' })} wide={wide} label="Qualifying classification from live timing" lastLabel="Best lap" /></>
  } else if (active === 'sprint') {
    body = <SessionTable kind="race" rows={raceRows(race.SprintResults)} wide={wide} label="Sprint classification" onDriverClick={onDriverClick} entrance={entrance} reduced={reduced} />
  } else if (active === 'shootout') {
    body = <SessionTable kind="quali" rows={qualiRows(race.SprintQualifyingResults, { shootout: true })} qLabels={['SQ1', 'SQ2', 'SQ3']} wide={wide} label="Sprint shootout classification" entrance={entrance} reduced={reduced} />
  } else if (active === 'practice') {
    body = <PracticePanel schedule={race.schedule} season={season} round={round} now={now} />
  }

  return (
    <section className="section min-w-0" aria-labelledby="weekend-results-h">
      <div className="mb-pw-3 flex flex-col gap-pw-3 md:flex-row md:items-center md:justify-between">
        <h2 id="weekend-results-h" className="text-heading text-ink">Results</h2>
        <div className={cn(OPTION_ROW, '-mx-pw-4 px-pw-4 md:mx-0 md:px-0')}>
          <SegmentedControl
            role="tablist" aria-label="Session results" options={options} value={active} onChange={choose}
            controls="weekend-results-panel" idPrefix="weekend-tab" className="w-max shrink-0 md:w-fit"
          />
        </div>
      </div>
      <Panel
        padding="none" id="weekend-results-panel" role="tabpanel" aria-labelledby={`weekend-tab-${active}`} tabIndex={-1}
        className="overflow-hidden outline-none"
      >
        {body}
      </Panel>
      <p className="sr-only" role="status">{SESSION_LABEL[active]} results shown</p>
    </section>
  )
}
