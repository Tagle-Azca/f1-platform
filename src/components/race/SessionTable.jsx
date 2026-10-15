import { motion } from 'framer-motion'
import StatusBadge from './StatusBadge'
import Delta from './PositionDelta'
import { teamMark, BASE } from '../../styles/vizPalette'
import { EASE_OUT, staggerDelay } from '../../styles/motion'
import { cn } from '@/lib/utils'

// Wide (md+) column templates: position, team stripe, driver, team, then the numeric columns of the session.
const GRID = {
  race: 'grid-cols-[3rem_4px_minmax(0,1fr)_minmax(0,1fr)_3rem_4rem_6rem_3.5rem]',
  quali: 'grid-cols-[3rem_4px_minmax(0,1fr)_minmax(0,1fr)_5rem_5rem_5rem]',
  snapshot: 'grid-cols-[3rem_4px_minmax(0,1fr)_minmax(0,1fr)_7rem]',
}
const HEADERS = {
  race: ['Pos', '', 'Driver', 'Team', 'Grid', '+/-', 'Time or status', 'Pts'],
  snapshot: (last) => ['Pos', '', 'Driver', 'Team', last],
}
const ALIGN = {
  race: ['text-right', '', '', '', 'text-center', 'text-center', 'text-right', 'text-right'],
  quali: ['text-right', '', '', '', 'text-right', 'text-right', 'text-right'],
  snapshot: ['text-right', '', '', '', 'text-right'],
}
const ENTRANCE_LIMIT = 12

function Stripe({ color, className = '' }) {
  return (
    <svg aria-hidden="true" focusable="false" width="4" height="32" className={cn('shrink-0', className)}>
      <rect width="4" height="32" rx="2" fill={color} />
    </svg>
  )
}

const markOf = (row) => teamMark(row.color, BASE.panel)

function Driver({ row }) {
  return (
    <span className="flex min-w-0 items-baseline gap-pw-2">
      {row.code && <span className="w-10 shrink-0 font-display text-[15px] font-semibold tracking-[0.02em]">{row.code}</span>}
      <span className={cn('truncate text-sm [overflow-wrap:anywhere]', row.isLeader ? 'font-semibold text-ink' : 'text-ink')}>{row.name}</span>
    </span>
  )
}

function WideCells({ kind, row }) {
  return (
    <>
      <span className={cn('num text-right text-[15px] font-medium', row.isLeader ? 'text-ink' : 'text-ink-2')}>{row.pos}</span>
      <Stripe color={markOf(row)} />
      <Driver row={row} />
      <span className="truncate text-sm text-ink-2">{row.team || '-'}</span>
      {kind === 'race' && (
        <>
          <span className="num text-center text-sm text-ink-2">{row.grid || '-'}</span>
          <span className="flex justify-center"><Delta value={row.delta} /></span>
          <span className="flex justify-end">
            {row.timeText ? <span className="num text-sm text-ink">{row.timeText}</span> : <StatusBadge word={row.status} />}
          </span>
          <span className="num text-right text-[15px] font-medium text-ink">{row.points || '-'}</span>
        </>
      )}
      {kind === 'quali' && row.q.map((v, i) => <span key={i} className={cn('num text-right text-sm', v ? 'text-ink' : 'text-ink-3')}>{v || '-'}</span>)}
      {kind === 'snapshot' && <span className="num text-right text-sm text-ink">{row.value}</span>}
    </>
  )
}

function NarrowRow({ kind, row }) {
  const right = kind === 'race' ? row.points : kind === 'snapshot' ? row.value : [...row.q].reverse().find(Boolean) || '-'
  return (
    <span className="grid grid-cols-[2rem_4px_minmax(0,1fr)_auto] items-center gap-x-pw-3 px-pw-3 py-pw-2">
      <span className={cn('num row-span-2 self-center text-right text-[15px] font-medium', row.isLeader ? 'text-ink' : 'text-ink-2')}>{row.pos}</span>
      <Stripe color={markOf(row)} className="row-span-2 self-center" />
      <Driver row={row} />
      <span className="num text-right text-[15px] font-medium text-ink">{right || '-'}</span>
      <span className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-pw-3 text-xs text-ink-2">
        <span className="truncate">{row.team || '-'}</span>
        {kind === 'race' && (
          <>
            {row.grid && <span className="num">from {row.grid === 'PL' ? 'pit lane' : `P${row.grid}`}</span>}
            <Delta value={row.delta} />
            {row.timeText ? <span className="num text-ink">{row.timeText}</span> : <StatusBadge word={row.status} />}
          </>
        )}
        {kind === 'quali' && <span className="num">{row.q.map((v, i) => `Q${i + 1} ${v || '-'}`).join('  ')}</span>}
      </span>
    </span>
  )
}

/**
 * One session's classification as a hairline list. Wide: an 8-column grid with a header row. Narrow: two lines per
 * driver, no horizontal scroll. Wide rows are full-row buttons when `onDriverClick` is given (opens the driver drawer).
 * Every row has a spoken summary; the visual cells are hidden from assistive technology.
 * @param {'race'|'quali'|'snapshot'} kind
 */
export default function SessionTable({ kind, rows, wide, label, lastLabel = 'Gap', qLabels = ['Q1', 'Q2', 'Q3'], onDriverClick, entrance = false, reduced = false }) {
  const headers = kind === 'race' ? HEADERS.race : kind === 'snapshot' ? HEADERS.snapshot(lastLabel) : ['Pos', '', 'Driver', 'Team', ...qLabels]
  return (
    <div className="min-w-0">
      {wide && (
        <div aria-hidden="true" className={cn('grid gap-x-pw-3 border-b border-edge px-pw-3 py-pw-2 text-xs text-ink-3', GRID[kind])}>
          {headers.map((h, i) => <span key={i} className={ALIGN[kind][i]}>{h}</span>)}
        </div>
      )}
      <ol className="m-0 list-none p-0" aria-label={label}>
        {rows.map((row, i) => {
          const clickable = wide && Boolean(row.driverId) && Boolean(onDriverClick)
          const anim = entrance && !reduced && i < ENTRANCE_LIMIT
            ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.24, ease: EASE_OUT, delay: staggerDelay(i, 0.02, ENTRANCE_LIMIT) } }
            : {}
          const body = wide
            ? <span aria-hidden="true" className={cn('grid min-h-[52px] items-center gap-x-pw-3 px-pw-3', GRID[kind])}><WideCells kind={kind} row={row} /></span>
            : <span aria-hidden="true" className="block"><NarrowRow kind={kind} row={row} /></span>
          return (
            <motion.li key={row.key} data-row={row.pos} className={cn('border-b border-edge-soft last:border-b-0', row.isLeader && 'bg-steel-soft')} {...anim}>
              {clickable ? (
                <button
                  type="button" aria-label={row.spoken}
                  onClick={() => onDriverClick({ driverId: row.driverId, name: row.name })}
                  className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-ink outline-offset-[-2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-steel [@media(hover:hover)]:hover:bg-hover"
                >
                  {body}
                </button>
              ) : (
                <div className="text-ink"><span className="sr-only">{row.spoken}</span>{body}</div>
              )}
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
