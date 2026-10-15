import { useId } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftRight, X } from 'lucide-react'
import Panel from '../ui/Panel'
import DriverCombobox from './DriverCombobox'
import { buttonVariants } from '../ui/button-variants'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'
import { cn } from '@/lib/utils'
import { givenNames, latestTeam, seasonRange, slotColor, surname } from './teammatesModel'

function TeamLine({ color, name }) {
  return (
    <span className="mt-pw-1 flex items-center gap-pw-2 text-xs text-ink-2">
      <svg aria-hidden="true" focusable="false" width="3" height="12"><rect width="3" height="12" rx="1.5" fill={color} /></svg>
      {name}
    </span>
  )
}

function RemoveButton({ name, onRemove }) {
  return (
    <button type="button" aria-label={`Remove ${surname(name)}`} onClick={onRemove} className="inline-flex min-h-11 cursor-pointer items-center gap-pw-1 border-0 bg-transparent px-pw-2 text-sm text-ink-2 hover:text-ink">
      <X aria-hidden="true" size={16} />
      Remove
    </button>
  )
}

export function Filled({ slot, align, onRemove }) {
  const { id, name, status, data, retry } = slot
  const team = latestTeam(data?.teams)
  const stats = data?.stats
  const range = stats ? seasonRange([stats.firstSeason, stats.lastSeason]) : ''
  return (
    <div className={cn('flex min-w-0 flex-col', align)}>
      <Link
        to={`/drivers/${encodeURIComponent(id)}`} aria-label={name}
        className={cn('flex min-h-11 min-w-0 flex-col justify-end no-underline hover:[&>span:last-child]:text-steel-hi', align)}
      >
        <span className="truncate text-xs text-ink-2 md:text-sm">{givenNames(name)}</span>
        <span className="font-display text-xl font-bold uppercase leading-tight text-ink [overflow-wrap:anywhere] md:text-3xl">{surname(name)}</span>
      </Link>
      {status === 'ready' && team && <TeamLine color={slotColor(data)} name={team.name} />}
      {status === 'ready' && range && <span className="num mt-pw-1 text-xs text-ink-3">{range}</span>}
      {status === 'loading' && <span aria-hidden="true" className="viz-pulse mt-pw-2 h-3 w-24 rounded-[2px] bg-edge-soft" />}
      {status === 'error' && (
        <div role="alert" className="mt-pw-2 flex flex-col gap-pw-1">
          <p className="text-sm text-ink-2">We couldn&apos;t load {surname(name)}.</p>
          <button type="button" onClick={retry} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 self-start')}>Try again</button>
        </div>
      )}
      {status === 'nodata' && <p className="mt-pw-2 text-sm text-ink-2">No race data for this driver in Pitwall.</p>}
      <RemoveButton name={name} onRemove={onRemove} />
    </div>
  )
}

/**
 * The matchup bar: two slots and a central VS. An empty slot is an inline driver combobox, a filled slot is the name block
 * (never a disabled input). Remove and swap are real buttons; every selection change is reported to the page (URL-backed).
 */
export default function MatchupHero({ slots, onPick, onRemove, onSwap, focusSlot }) {
  const reduced = useReducedMotion()
  const gradId = useId()
  const [sa, sb] = slots
  const both = Boolean(sa.id && sb.id)
  const ready = sa.status === 'ready' && sb.status === 'ready'
  const colorA = slotColor(sa.data)
  const colorB = slotColor(sb.data)
  const exclude = slots.map((s) => s.id).filter(Boolean)
  const busy = slots.some((s) => s.status === 'loading')
  const alignFor = (i) => (i === 0 ? 'items-start text-left md:items-center md:text-center' : 'items-end text-right md:items-center md:text-center')

  const renderSlot = (s, i) => {
    const key = i === 0 ? 'a' : 'b'
    if (s.id) return <Filled slot={s} align={alignFor(i)} onRemove={() => onRemove(key)} />
    return (
      <DriverCombobox
        id={`teammates-pick-${key}`} label={i === 0 ? 'First driver' : 'Second driver'}
        placeholder={i === 0 ? 'Search for a driver' : sa.id ? 'Pick a rival' : 'Search for a driver'}
        exclude={exclude} onPick={(info) => onPick(key, info)}
        autoFocus={focusSlot === key} highlight={i === 1 && Boolean(sa.id)}
      />
    )
  }

  return (
    <Panel as="section" aria-label="Matchup" aria-busy={busy || undefined} className="relative overflow-hidden">
      {ready && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <radialGradient id={`${gradId}a`} cx="18%" cy="22%" r="45%"><stop offset="0" stopColor={colorA} stopOpacity="0.22" /><stop offset="1" stopColor={colorA} stopOpacity="0" /></radialGradient>
            <radialGradient id={`${gradId}b`} cx="82%" cy="22%" r="45%"><stop offset="0" stopColor={colorB} stopOpacity="0.22" /><stop offset="1" stopColor={colorB} stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${gradId}a)`} />
          <rect width="100" height="100" fill={`url(#${gradId}b)`} />
        </svg>
      )}
      <div className={cn('relative grid items-center gap-pw-3', both ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-pw-2 md:gap-x-pw-6' : 'grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-pw-6')}>
        {renderSlot(sa, 0)}
        <motion.div
          className="flex flex-col items-center gap-pw-1 self-center"
          initial={reduced ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DUR.enter, ease: EASE_OUT, delay: 0.15 }}
        >
          <span aria-hidden="true" className={cn('font-display font-black italic tracking-tight text-ink-3', both ? 'text-3xl md:text-5xl' : 'rounded-pill border border-edge bg-raise px-pw-3 py-pw-1 text-xs md:border-0 md:bg-transparent md:p-0 md:text-3xl')}>VS</span>
          {both && (
            <button type="button" aria-label="Swap drivers" onClick={onSwap} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'cursor-pointer')}>
              <ArrowLeftRight aria-hidden="true" size={16} />
            </button>
          )}
        </motion.div>
        {renderSlot(sb, 1)}
      </div>
    </Panel>
  )
}
