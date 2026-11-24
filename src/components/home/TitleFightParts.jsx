import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DriverPortrait from '../viz/DriverPortrait'
import { DUR, EASE_OUT } from '../../styles/motion'
import { safeString } from '../../utils/safeText'
import { useCountUp } from '../../hooks/useCountUp'
import { surname, given } from './nameParts'

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
function NameLink({ driver, align, champion }) {
  const body = (
    <>
      <span className="truncate text-xs text-ink-2 md:text-sm">{given(driver.name)}</span>
      <span className={`font-display text-xl font-bold uppercase leading-tight [overflow-wrap:anywhere] md:text-3xl ${champion ? 'text-gold' : 'text-ink'}`}>{surname(driver.name)}</span>
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

export function Contender({ driver, color, side, reduced, champion = false }) {
  const points = useCountUp(driver.points)
  const align = side === 'left' ? 'items-start text-left md:items-center md:text-center' : 'items-end text-right md:items-center md:text-center'
  return (
    <div className="flex min-w-0 flex-col">
      <Portrait driver={driver} color={color} side={side} reduced={reduced} />
      <div className={`mt-pw-3 flex min-w-0 flex-col ${align}`}>
        <NameLink driver={driver} align={align} champion={champion} />
        <span className="mt-pw-1 flex items-center gap-pw-2 text-xs text-ink-2">
          <svg aria-hidden="true" focusable="false" width="3" height="12"><rect width="3" height="12" rx="1.5" fill={color} /></svg>
          {safeString(driver.team)}
        </span>
        {/* The counting number is decorative; the sr-only sentence above states the points */}
        <span aria-hidden="true" className={`text-count mt-pw-2 ${champion ? 'text-gold' : 'text-ink'}`}>{points}<span className="ml-1 text-sm font-medium text-ink-3">pts</span></span>
      </div>
    </div>
  )
}

/** Mirrored comparison row: A's bar grows left from the label, B's grows right. */
export function StatRow({ row, colorA, colorB, reduced, index }) {
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
