import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import VizSkeleton from '../viz/VizSkeleton'
import DriverPortrait from '../viz/DriverPortrait'
import { titleFightModel } from '../viz/pointsModel'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { statsApi } from '../../services/api'
import { ctorColor, teamMark } from '../../styles/vizPalette'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'
import { safeString } from '../../utils/safeText'
import { useCountUp } from '../../hooks/useCountUp'
import { statRows, neededPerRound, pointsShare } from './titleFightVs'

const surname = (name) => safeString(name).split(' ').pop() || 'The leader'
const given = (name) => safeString(name).split(' ').slice(0, -1).join(' ')

/** Season stats for both contenders; null until loaded, {} entries on failure. */
function useContenderStats(season, idA, idB) {
  const key = `${season}|${idA}|${idB}`
  const [res, setRes] = useState(null)
  useEffect(() => {
    if (!season || !idA || !idB) return
    let cancelled = false
    // Promise.resolve().then turns a synchronous throw (missing client, bad args) into a caught rejection
    const perf = (id) => Promise.resolve().then(() => statsApi.historicalPerformance(id, season)).catch(() => null)
    Promise.all([perf(idA), perf(idB)]).then(([a, b]) => { if (!cancelled) setRes({ key, a, b }) })
    return () => { cancelled = true }
  }, [key, season, idA, idB])
  return res?.key === key ? res : null
}

/** Cut-out headshot over the car number (shared artwork, Dashboard sizing and entrance). */
function Portrait({ driver, color, side, reduced }) {
  return (
    <DriverPortrait
      photoUrl={driver.photoUrl} number={driver.permanentNumber} color={color}
      className="relative flex h-32 w-full items-end justify-center md:h-48"
      imgClassName="relative h-32 w-32 object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_72%,transparent)] md:h-48 md:w-48"
      motionProps={{
        initial: reduced ? false : { opacity: 0, x: side === 'left' ? -32 : 32 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: DUR.enter, ease: EASE_OUT },
      }}
    />
  )
}

/** Name block; links to the driver profile when there is an id (accessible name = full name). */
function NameLink({ driver, align }) {
  const body = (
    <>
      <span className="truncate text-xs text-ink-2 md:text-sm">{given(driver.name)}</span>
      <span className="font-display text-xl font-bold uppercase leading-tight text-ink [overflow-wrap:anywhere] md:text-3xl">{surname(driver.name)}</span>
    </>
  )
  if (!driver.driverId) return <span className={`flex min-w-0 flex-col ${align}`}>{body}</span>
  return (
    <Link
      to={`/drivers/${encodeURIComponent(driver.driverId)}`}
      aria-label={safeString(driver.name)}
      className={`flex min-h-11 min-w-0 flex-col justify-end no-underline hover:[&>span:last-child]:text-steel-hi ${align}`}
    >
      {body}
    </Link>
  )
}

function Contender({ driver, color, side, reduced }) {
  const points = useCountUp(driver.points)
  const align = side === 'left' ? 'items-start text-left md:items-center md:text-center' : 'items-end text-right md:items-center md:text-center'
  return (
    <div className="flex min-w-0 flex-col">
      <Portrait driver={driver} color={color} side={side} reduced={reduced} />
      <div className={`mt-pw-3 flex min-w-0 flex-col ${align}`}>
        <NameLink driver={driver} align={align} />
        <span className="mt-pw-1 flex items-center gap-pw-2 text-xs text-ink-2">
          <svg aria-hidden="true" focusable="false" width="3" height="12"><rect width="3" height="12" rx="1.5" fill={color} /></svg>
          {safeString(driver.team)}
        </span>
        {/* The counting number is decorative; the sr-only sentence above states the points */}
        <span aria-hidden="true" className="text-count mt-pw-2 text-ink">{points}<span className="ml-1 text-sm font-medium text-ink-3">pts</span></span>
      </div>
    </div>
  )
}

/** Mirrored comparison row: A's bar grows left from the label, B's grows right. */
function StatRow({ row, colorA, colorB, reduced, index }) {
  const max = Math.max(1, row.a ?? 0, row.b ?? 0)
  const pa = ((row.a ?? 0) / max) * 100
  const pb = ((row.b ?? 0) / max) * 100
  const anim = (w) => (reduced ? { initial: false } : { initial: { width: 0 }, animate: { width: w }, transition: { duration: DUR.bars, ease: EASE_OUT, delay: 0.25 + index * 0.06 } })
  const strong = (mine, other) => (mine != null && other != null && mine > other ? 'font-semibold text-ink' : 'text-ink-2')
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto_minmax(0,1fr)_2rem] items-center gap-x-pw-2 py-pw-1 md:grid-cols-[2.5rem_minmax(0,1fr)_9rem_minmax(0,1fr)_2.5rem]">
      <span className={`num text-left ${strong(row.a, row.b)}`}>{row.a ?? '–'}</span>
      <svg aria-hidden="true" viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full">
        <rect width="100" height="6" rx="1" fill="var(--viz-track)" />
        <g transform="translate(100 0) scale(-1 1)">
          <motion.rect height="6" rx="1" fill={colorA} width={pa} {...anim(pa)} />
        </g>
      </svg>
      <span className="px-pw-1 text-center text-xs text-ink-3">{row.label}</span>
      <svg aria-hidden="true" viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full">
        <rect width="100" height="6" rx="1" fill="var(--viz-track)" />
        <motion.rect height="6" rx="1" fill={colorB} width={pb} {...anim(pb)} />
      </svg>
      <span className={`num text-right ${strong(row.b, row.a)}`}>{row.b ?? '–'}</span>
    </li>
  )
}

export default function TitleFightCard({ data, loading, error, onRetry }) {
  const reduced = useReducedMotion()
  const gradId = useId()
  const model = titleFightModel(data?.standings, data?.totalRounds, data?.roundsDone, data?.season)
  const [a, b] = model.rows
  // season arrives as a number or a string depending on the code path
  const season = Number.isFinite(Number(data?.season)) && data?.season !== '' && data?.season != null ? String(data.season) : ''
  const stats = useContenderStats(season, a?.driverId, b?.driverId)

  if (loading) {
    return (
      <section className="section" aria-label="Title fight">
        <h2 className="text-heading mb-pw-4 text-ink">Title fight</h2>
        <VizSkeleton variant="pointsrace" name="title fight" />
      </section>
    )
  }
  if (error && !data) {
    return (
      <section className="section" aria-labelledby="title-fight-h" role="alert">
        <h2 id="title-fight-h" className="text-heading mb-pw-3 text-ink">Title fight</h2>
        <p className="mb-pw-3 text-sm text-ink-2">Title fight data unavailable.</p>
        <button type="button" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')} onClick={onRetry}>Try again</button>
      </section>
    )
  }
  if (model.rows.length < 2) {
    return (
      <section className="section" aria-labelledby="title-fight-h">
        <h2 id="title-fight-h" className="text-heading mb-pw-3 text-ink">Title fight</h2>
        <p className="text-sm text-ink-2">Standings appear after the first race.</p>
      </section>
    )
  }

  const { remaining, inPlay, gap, decided, final } = model
  const colorA = teamMark(ctorColor(a.constructorId))
  const colorB = teamMark(ctorColor(b.constructorId))
  const teammates = a.constructorId && a.constructorId === b.constructorId
  const share = pointsShare(a.points, b.points) * 100
  const need = neededPerRound(gap, remaining)
  const third = model.rows[2]
  const thirdGap = third ? a.points - third.points : null
  const rows = stats ? statRows(stats.a, stats.b) : []

  const verdict = final
    ? `${surname(a.name)} is champion.`
    : decided
      ? `${surname(a.name)} can no longer be caught on points alone.`
      : `Still open: ${inPlay} points in play against a ${gap}-point gap.`

  return (
    <Panel as="section" aria-labelledby="title-fight-h" className="relative overflow-hidden">
      {/* Team-color glow behind each contender */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <radialGradient id={`${gradId}a`} cx="18%" cy="22%" r="45%"><stop offset="0" stopColor={colorA} stopOpacity="0.22" /><stop offset="1" stopColor={colorA} stopOpacity="0" /></radialGradient>
          <radialGradient id={`${gradId}b`} cx="82%" cy="22%" r="45%"><stop offset="0" stopColor={colorB} stopOpacity="0.22" /><stop offset="1" stopColor={colorB} stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${gradId}a)`} />
        <rect width="100" height="100" fill={`url(#${gradId}b)`} />
      </svg>

      <div className="relative">
        <div className="flex flex-wrap items-baseline justify-between gap-pw-2">
          <h2 id="title-fight-h" className="text-heading text-ink">Title fight</h2>
          <span className="flex flex-wrap items-center gap-pw-2">
            {teammates && <span className="inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2">Teammates</span>}
            <span className="text-xs text-ink-3">{remaining} rounds left</span>
          </span>
        </div>
        <p className="mt-pw-1 text-sm text-ink-2">{verdict}</p>

        {/* Screen readers get the matchup as one sentence */}
        <p className="sr-only">
          {a.name}, {a.points} points, leads {b.name}, {b.points} points, by {gap}.
        </p>

        <div className="mt-pw-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-pw-2 md:gap-x-pw-6">
          <Contender driver={a} color={colorA} side="left" reduced={reduced} />
          <motion.div
            aria-hidden="true"
            className="flex flex-col items-center gap-pw-1 self-center"
            initial={reduced ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR.enter, ease: EASE_OUT, delay: 0.15 }}
          >
            <span className="font-display text-3xl font-black italic tracking-tight text-ink-3 md:text-5xl">VS</span>
            <span className="num whitespace-nowrap text-ink">{gap > 0 ? `${gap} pts` : 'Level'}</span>
            <span className="text-xs text-ink-3">gap</span>
          </motion.div>
          <Contender driver={b} color={colorB} side="right" reduced={reduced} />
        </div>

        {/* Tug of war: share of the two drivers' combined points */}
        <div className="mt-pw-4" aria-hidden="true">
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-2 w-full">
            <rect width="100" height="8" rx="1" fill={colorB} fillOpacity={teammates ? 0.5 : 1} />
            <motion.rect height="8" rx="1" fill={colorA} width={share} {...(reduced ? {} : { initial: { width: 50 }, animate: { width: share }, transition: { duration: DUR.draw, ease: EASE_OUT, delay: 0.2 } })} />
            <rect x="49.85" width="0.3" height="8" fill="var(--pw-bg)" />
          </svg>
          <p className="mt-pw-1 flex justify-between text-xs text-ink-3">
            <span>{Math.round(share)}% of their points</span>
            <span>{Math.round(100 - share)}%</span>
          </p>
        </div>

        {/* Season head-to-head */}
        {stats === null ? (
          <div className="mt-pw-4"><VizSkeleton variant="rows" name="season head-to-head" count={4} /></div>
        ) : rows.length > 0 && (
          <div className="mt-pw-4 border-t border-edge-soft pt-pw-3">
            <h3 className="mb-pw-2 text-xs text-ink-3">This season, head to head</h3>
            <ul aria-label="Season head to head">
              {rows.map((r, i) => (
                <StatRow key={r.key} row={r} colorA={colorA} colorB={colorB} reduced={reduced} index={i} />
              ))}
            </ul>
            <ul className="sr-only">
              {rows.map(r => <li key={r.key}>{r.label}: {surname(a.name)} {r.a ?? 'no data'}, {surname(b.name)} {r.b ?? 'no data'}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-pw-4 flex flex-col gap-pw-2 border-t border-edge-soft pt-pw-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink-2">
            {need && !decided && <>{surname(b.name)} needs <span className="num text-ink">{need}</span> more points than {surname(a.name)} per round to draw level. </>}
            {!final && third && thirdGap < inPlay && <>{surname(third.name)} is still in reach, {thirdGap} behind.</>}
          </p>
          <Link to="/standings" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-steel no-underline hover:text-steel-hi">
            Show full battle
          </Link>
        </div>
      </div>
    </Panel>
  )
}
