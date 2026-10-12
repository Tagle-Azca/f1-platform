import { memo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronDown } from 'lucide-react'
import GapBar from '../viz/GapBar'
import RowDetail from './RowDetail'
import { gapLabel } from './standingsModel'
import { teamMark, BASE } from '../../styles/vizPalette'
import { EASE_OUT, staggerDelay } from '../../styles/motion'
import { cn } from '@/lib/utils'

function Change({ delta, show }) {
  if (!show) return <span aria-hidden="true" className="w-8" />
  if (!delta) return <span aria-hidden="true" className="flex w-8 items-center"><span className="size-1.5 rounded-pill bg-ink-3" /></span>
  const Icon = delta > 0 ? ArrowUp : ArrowDown
  return (
    <span aria-hidden="true" className={cn('flex w-8 items-center gap-0.5 text-xs', delta > 0 ? 'text-pos' : 'text-neg')}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="num">{Math.abs(delta)}</span>
    </span>
  )
}

const changeText = (delta, show, prevRound) => {
  if (!show) return ''
  if (!delta) return `No change since round ${prevRound}`
  const n = Math.abs(delta)
  return `${delta > 0 ? 'Up' : 'Down'} ${n} ${n === 1 ? 'place' : 'places'} since round ${prevRound}`
}

/** Team stripe: solid for the first teammate, dashed for the second. */
function Stripe({ color, dash }) {
  return (
    <svg aria-hidden="true" focusable="false" width="4" height="32" className="shrink-0">
      {dash
        ? <line x1="2" y1="1" x2="2" y2="31" stroke={color} strokeWidth="4" strokeDasharray="5 3" />
        : <rect width="4" height="32" rx="2" fill={color} />}
    </svg>
  )
}

/** Share-of-leader bar with the "can still catch the leader" tick on the same track. */
function ShareBar({ row, leaderPts, tick, height, index, animate }) {
  return (
    <span className="relative block min-w-0 flex-1" aria-hidden="true">
      <GapBar value={row.pts} max={leaderPts} mode="share" color={row.color} height={height} index={index} animate={animate} />
      {tick != null && (
        <svg focusable="false" width="100%" height={height} className="pointer-events-none absolute inset-0">
          <rect x={`${tick * 100}%`} y={height / 2 - 3.5} width="1" height="7" fill="var(--viz-baseline)" />
        </svg>
      )}
    </span>
  )
}

function StandingsRow({
  row, index, isWide, isLeader, leaderPts, showDelta, round, open, hovered, marksOut, isOut, tick, detail, rounds,
  onToggle, onHover, onOpenProfile, flip, entrance,
}) {
  const buttonId = `st-row-${row.id}`
  const regionId = `st-detail-${row.id}`
  const color = teamMark(row.color, BASE.bg)
  const btn = useRef(null)
  const isCtor = row.kind === 'constructor'
  const winsText = row.wins === 1 ? '1 win' : row.wins > 1 ? `${row.wins} wins` : ''
  const line2 = isCtor ? (winsText || 'No wins') : [row.team, winsText].filter(Boolean).join(', ')
  const outText = marksOut && isOut
  const gapText = isLeader ? 'Leader' : gapLabel(row.gap)
  const srName = [
    `${row.pos}`, row.name, isCtor ? '' : row.team, `${row.pts} points`,
    isLeader ? 'Leader' : `${row.gap} behind the leader`, changeText(row.delta, showDelta, round - 1), outText ? 'Out of the title race' : '',
  ].filter(Boolean).join(', ')

  const motionProps = {
    layout: flip ? 'position' : false,
    transition: { duration: 0.32, ease: EASE_OUT },
    ...(entrance ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, } : {}),
  }
  if (entrance) motionProps.transition = { duration: 0.4, ease: EASE_OUT, delay: staggerDelay(index, 0.04) }

  function onRegionKey(e) {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    onToggle(null)
    btn.current?.focus()
  }

  return (
    <motion.li {...motionProps} className="m-0 list-none border-b border-edge-soft last:border-b-0" data-row-id={row.id}>
      <button
        ref={btn}
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={open ? regionId : undefined}
        data-hover={hovered || undefined}
        onClick={() => onToggle(open ? null : row.id)}
        onMouseEnter={() => onHover(row.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(row.id)}
        onBlur={() => onHover(null)}
        className={cn(
          'relative block w-full cursor-pointer scroll-mt-[calc(var(--header-height)+56px)] border-0 bg-transparent p-0 text-left text-ink transition-colors duration-100 active:translate-y-px',
          'focus-visible:outline-offset-[-2px] [@media(hover:hover)]:hover:bg-hover data-[hover=true]:bg-hover',
          open && 'bg-steel-soft [@media(hover:hover)]:hover:bg-steel-soft',
        )}
      >
        <span className="sr-only">{srName}</span>
        {isWide ? (
          <span aria-hidden="true" className={cn('grid h-[52px] items-center gap-x-pw-3 px-pw-3', isCtor
            ? 'grid-cols-[1.5rem_2.5rem_4px_minmax(0,1.4fr)_3rem_8rem_4.5rem_1.25rem]'
            : 'grid-cols-[1.5rem_2.5rem_4px_minmax(0,1.4fr)_minmax(0,1fr)_3rem_8rem_4.5rem_1.25rem]')}
          >
            <span className={cn('num text-right text-[15px] font-medium', isLeader ? 'text-ink' : 'text-ink-2')}>{row.pos}</span>
            <Change delta={row.delta} show={showDelta} />
            <Stripe color={color} dash={row.dash} />
            <span className="flex min-w-0 items-baseline gap-pw-2">
              {!isCtor && <span className="w-10 shrink-0 font-display text-[15px] font-semibold tracking-[0.02em]">{row.code}</span>}
              <span className={cn('truncate text-sm [overflow-wrap:anywhere]', isLeader ? 'font-semibold text-ink' : 'text-ink')}>{row.name}</span>
            </span>
            {!isCtor && <span className="truncate text-sm text-ink-2">{row.team}</span>}
            <span className="num text-right text-ink-2">{row.wins}</span>
            <span className="flex items-center gap-pw-2">
              <ShareBar row={row} leaderPts={leaderPts} tick={marksOut ? tick : null} height={6} index={index} animate={entrance} />
              <span className="num w-10 shrink-0 text-xs text-ink-3">{isLeader ? '' : gapLabel(row.gap)}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="num text-[15px] font-medium text-ink">{row.pts}</span>
              {outText && <span className="text-xs text-ink-3" title="Out of the title race">Out</span>}
            </span>
            <ChevronDown size={16} className={cn('text-ink-3 transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')} />
          </span>
        ) : (
          <span aria-hidden="true" className="block">
            <span className="grid h-[53px] grid-cols-[1.5rem_2rem_4px_minmax(0,1fr)_auto_1.25rem] items-center gap-x-pw-2 px-pw-3">
              <span className={cn('num text-right text-[15px] font-medium', isLeader ? 'text-ink' : 'text-ink-2')}>{row.pos}</span>
              <Change delta={row.delta} show={showDelta} />
              <Stripe color={color} dash={row.dash} />
              <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-baseline gap-pw-2">
                  {!isCtor && <span className="font-display text-[15px] font-semibold tracking-[0.02em]">{row.code}</span>}
                  <span className={cn('truncate text-sm [overflow-wrap:anywhere]', isLeader ? 'font-semibold text-ink' : isCtor ? 'text-ink' : 'text-ink-2')}>{isCtor ? row.name : row.surname}</span>
                </span>
                <span className="truncate text-xs text-ink-3">{line2}{outText ? `${line2 ? ', ' : ''}out of the title race` : ''}</span>
              </span>
              <span className="flex flex-col items-end">
                <span className="num text-[15px] font-medium text-ink">{row.pts}</span>
                <span className="num text-xs text-ink-3">{gapText}</span>
              </span>
              <ChevronDown size={16} className={cn('text-ink-3 transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')} />
            </span>
            <span className="flex h-[3px] pl-[96px] pr-[40px]">
              <ShareBar row={row} leaderPts={leaderPts} tick={marksOut ? tick : null} height={3} index={index} animate={entrance} />
            </span>
          </span>
        )}
      </button>
      {open && detail && (
        <RowDetail
          id={regionId} labelledBy={buttonId} row={row} detail={detail} round={round} rounds={rounds}
          onOpenProfile={() => onOpenProfile(row)} onKeyDown={onRegionKey}
        />
      )}
    </motion.li>
  )
}

export default memo(StandingsRow)
