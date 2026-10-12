import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Panel from '../ui/Panel'
import DriverPortrait from '../viz/DriverPortrait'
import { gapLabel } from './standingsModel'
import { useTweenedNumber } from '../../hooks/useTweenedNumber'
import { teamMark } from '../../styles/vizPalette'
import { DUR, EASE_OUT, staggerDelay, useReducedMotion } from '../../styles/motion'
import { safeHttpsUrl } from '../../utils/safeUrl'
import { cn } from '@/lib/utils'

// Per-slot geometry (Tailwind needs the full class names). P1 is the tall, centre column.
const SLOT = {
  1: {
    box: 'h-28 md:h-36 lg:h-44',
    img: 'size-[88px] md:size-28 lg:size-36',
    glow: { cx: '50%', cy: '25%' },
    name: 'text-[15px] min-[420px]:text-xl md:text-2xl',
    pts: 'text-count',
  },
  2: {
    box: 'h-20 md:h-[104px] lg:h-[136px]',
    img: 'size-16 md:size-[88px] lg:size-28',
    glow: { cx: '18%', cy: '40%' },
    name: 'text-[15px] min-[420px]:text-xl md:text-2xl',
    pts: 'text-stat',
  },
  3: {
    box: 'h-20 md:h-[104px] lg:h-[136px]',
    img: 'size-16 md:size-[88px] lg:size-28',
    glow: { cx: '82%', cy: '40%' },
    name: 'text-[15px] min-[420px]:text-xl md:text-2xl',
    pts: 'text-stat',
  },
}

/** Gap bar on a shared scale. Drawn full width and scaled, so following a new gap is a transform tween. */
function HeroGapBar({ fraction, color, index, settled, reduced }) {
  const f = fraction > 0 ? Math.min(1, Math.max(0.03, fraction)) : 0
  const transition = reduced ? { duration: 0 } : { duration: settled ? 0.32 : DUR.bars, ease: EASE_OUT, delay: settled ? 0 : staggerDelay(index, 0.08) }
  return (
    <svg aria-hidden="true" focusable="false" width="100%" height="6" className="block w-full shrink-0">
      <rect width="100%" height="6" rx="2" fill="var(--viz-track)" />
      <motion.rect width="100%" height="6" rx="2" fill={color} className="viz-grow" initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: f }} transition={transition} />
    </svg>
  )
}

const safeNumber = (photo) => (photo && typeof photo.number === 'string' ? photo.number : '')
const nameOf = (row) => (row.kind === 'constructor' ? row.name : row.surname)

function NameControl({ row, onOpen, className, children }) {
  if (row.kind === 'constructor') {
    return (
      <button type="button" aria-label={row.name} onClick={() => onOpen?.(row)} className={cn('min-h-11 cursor-pointer border-0 bg-transparent p-0 text-center', className)}>
        {children}
      </button>
    )
  }
  return (
    <Link to={`/drivers/${encodeURIComponent(row.id)}`} aria-label={row.name} className={cn('inline-flex min-h-11 items-center justify-center text-center no-underline', className)}>
      {children}
    </Link>
  )
}

function Column({ ref, row, slot, kind, hero, color, photo, datasetKey, settled, source, onOpen, scaleMax, index }) {
  const reduced = useReducedMotion()
  const geo = SLOT[slot]
  const pts = useTweenedNumber(row.pts, { datasetKey, startAt: settled ? row.pts : 0 })
  const isLeader = slot === 1
  const numeral = row.kind === 'constructor' ? String(slot) : (row.number || safeNumber(photo) || String(slot))
  const photoUrl = row.kind === 'driver' ? safeHttpsUrl(photo?.photoUrl) : null
  const shows = hero.inPlay > 0 || kind === 'champion'
  const layout = !reduced && source === 'play' ? 'position' : false
  const enter = reduced ? { initial: false } : {
    initial: settled ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.12 } },
    transition: { duration: settled ? DUR.fast : 0.4, ease: EASE_OUT, delay: settled ? 0 : 0.1 + staggerDelay(index, 0.06) },
  }
  return (
    <motion.li ref={ref} layout={layout} transition={layout ? { duration: 0.32, ease: EASE_OUT } : undefined} className="m-0 flex min-w-0 list-none flex-col items-center">
      <motion.div className="flex w-full min-w-0 flex-col items-center" {...enter}>
        {isLeader && kind === 'champion' && (
          <span className="mb-pw-1 inline-flex min-h-6 items-center rounded-pill bg-steel-soft px-pw-3 text-xs font-medium text-steel">Champion</span>
        )}
        <DriverPortrait
          photoUrl={photoUrl} number={numeral} color={color}
          className={cn('relative flex w-full items-end justify-center', geo.box)}
          imgClassName={cn('relative object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_72%,transparent)]', geo.img)}
        />
        <NameControl row={row} onOpen={onOpen} className={cn('mt-pw-2 max-w-full font-display font-bold leading-tight text-ink hover:text-steel-hi [overflow-wrap:normal] [hyphens:none]', geo.name)}>
          {nameOf(row)}
        </NameControl>
        <span className="mt-pw-1 flex max-w-full items-center gap-pw-2 text-xs text-ink-2">
          <svg aria-hidden="true" focusable="false" width="3" height="12" className="shrink-0"><rect width="3" height="12" rx="1.5" fill={color} /></svg>
          <span className="truncate">{row.kind === 'driver' ? row.team : `${row.wins} ${row.wins === 1 ? 'win' : 'wins'}`}</span>
        </span>
        {/* The counting number is decorative; the sr-only sentence states the points */}
        <span aria-hidden="true" className={cn('mt-pw-2 text-ink', geo.pts)}>
          {pts}<span className="ml-1 text-sm font-medium text-ink-3">pts</span>
        </span>
        <div className="mt-pw-1 flex w-full min-w-0 flex-col items-center gap-pw-1" aria-hidden="true">
          {isLeader ? (
            <span className="text-xs text-ink-3">{kind === 'champion' ? 'Champion' : 'Leader'}</span>
          ) : (
            <>
              <span className="num text-ink">{gapLabel(row.gap)}</span>
              {shows && scaleMax > 0 && (
                <HeroGapBar fraction={row.gap / scaleMax} color={color} index={index} settled={settled} reduced={reduced} />
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.li>
  )
}

/**
 * The title fight (current or mid-season replay round) or the champion (final round of a finished season).
 * Stepped P2 | P1 | P3 podium. Everything here derives from the replay round via `hero` (heroModel of the ranked rows).
 */
export default function StandingsHero({ view, season, hero, photos, datasetKey, source, onOpenConstructor }) {
  const reduced = useReducedMotion()
  const gradId = useId().replace(/:/g, '')
  // Entrance motion (rise, count from 0, bar growth) runs once per dataset; later changes follow the replay.
  const [settledKey, setSettledKey] = useState(null)
  useEffect(() => {
    const t = setTimeout(() => setSettledKey(datasetKey), 1200)
    return () => clearTimeout(t)
  }, [datasetKey])
  const settled = settledKey === datasetKey

  const { kind, podium, inPlay, gap, remaining, perGp, decided } = hero
  if (podium.length < 2) {
    return <p className="text-sm text-ink-2">Standings appear after the first race.</p>
  }
  const [first, second, third] = podium
  const isCtor = view === 'constructors'
  const colorOf = (r) => teamMark(r.color)
  const fight = kind === 'fight'
  const teammates = !isCtor && Boolean(first.teamKey) && first.teamKey === second.teamKey
  const thirdGap = third ? first.pts - third.pts : null

  let verdict
  if (!fight) verdict = `${nameOf(first)} won the title by ${gap} points over ${nameOf(second)}.`
  else if (decided && inPlay > 0) verdict = `${nameOf(first)} can no longer be caught on points alone.`
  else if (inPlay === 0) verdict = `${nameOf(first)} leads by ${gap} points.`
  else verdict = `Still open: ${inPlay} points in play against a ${gap}-point gap.`
  const reach = fight && inPlay > 0 && third && thirdGap < inPlay ? ` ${nameOf(third)} is still in reach, ${thirdGap} behind.` : ''

  const caption = fight && remaining > 0
    ? `Counts ${perGp} points per remaining Grand Prix${isCtor ? ' (a one-two)' : ''}. Sprint points are not included.`
    : null
  // Bars share one scale: points in play for a fight; the third place gap for a champion.
  const scaleMax = fight ? inPlay : (third ? thirdGap : gap)

  const slots = [[second, 2], [first, 1], ...(third ? [[third, 3]] : [])]
  const glow = (row, slot) => {
    const c = colorOf(row)
    const g = SLOT[slot].glow
    const op = slot === 1 ? (fight ? 0.22 : 0.28) : 0.12
    return (
      <radialGradient key={slot} id={`${gradId}-${slot}`} cx={g.cx} cy={g.cy} r="40%">
        <stop offset="0" stopColor={c} stopOpacity={op} /><stop offset="1" stopColor={c} stopOpacity="0" />
      </radialGradient>
    )
  }

  return (
    <Panel as="section" aria-labelledby="st-hero-h" className="relative overflow-hidden">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>{slots.map(([r, s]) => glow(r, s))}</defs>
        {slots.map(([, s]) => <rect key={s} width="100" height="100" fill={`url(#${gradId}-${s})`} />)}
      </svg>

      <div className="relative">
        <div className="flex flex-wrap items-baseline justify-between gap-pw-2">
          <h2 id="st-hero-h" className="text-heading text-ink">{fight ? 'Title fight' : 'Champion'}</h2>
          <span className="flex flex-wrap items-center gap-pw-2">
            {teammates && <span className="inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2">Teammates</span>}
            <span className="text-xs text-ink-3">{fight ? `${remaining} ${remaining === 1 ? 'round' : 'rounds'} left` : season}</span>
          </span>
        </div>
        <p className="mt-pw-1 text-sm text-ink-2">{verdict}{reach}</p>
        <p className="sr-only">
          {first.name}, {first.pts} points, leads {second.name}, {second.pts} points, by {gap}.
          {third ? ` ${third.name} is third with ${third.pts} points.` : ''}
        </p>

        <ol aria-label={fight ? 'Top three' : 'Podium'} className="relative mt-pw-4 grid list-none grid-cols-3 items-end gap-x-pw-2 p-0 md:gap-x-pw-4">
          <AnimatePresence initial={false} mode={reduced ? undefined : 'popLayout'}>
            {slots.map(([row, slot], i) => (
              <Column
                key={row.id} row={row} slot={slot} kind={kind} hero={hero} color={colorOf(row)} photo={photos?.get(row.id)}
                datasetKey={datasetKey} settled={settled} source={source} onOpen={onOpenConstructor} scaleMax={scaleMax}
                index={[1, 0, 2][i] ?? i}
              />
            ))}
          </AnimatePresence>
        </ol>

        {caption && <p className="mt-pw-4 text-xs text-ink-3">{caption}</p>}
      </div>
    </Panel>
  )
}
