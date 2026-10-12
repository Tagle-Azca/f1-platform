import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { BASE, ctorColor, teamMark } from '../../styles/vizPalette'
import { cn } from '@/lib/utils'

const COLS = 'sm:grid-cols-[5.5rem_minmax(0,1.1fr)_repeat(3,minmax(0,1fr))_7rem]'
const WHO = ['Winner', 'Second', 'Third']

function Stripe({ constructorId }) {
  const fill = teamMark(ctorColor(typeof constructorId === 'string' ? constructorId : ''), BASE.bg)
  return (
    <svg aria-hidden="true" focusable="false" width="4" height="32" viewBox="0 0 4 32" className="shrink-0">
      <rect width="4" height="32" rx="2" fill={fill} />
    </svg>
  )
}

function Podium({ entry, index, className }) {
  if (!entry) return <td role="cell" className={cn('hidden sm:block', className)} />
  return (
    <td role="cell" className={cn('flex min-w-0 items-center gap-pw-3 px-pw-4 sm:px-pw-2', className)}>
      <span aria-hidden="true" className="num w-3 shrink-0 text-ink-3 sm:hidden">{index + 1}</span>
      <Stripe constructorId={entry.constructorId} />
      <span className="min-w-0">
        <span className="sr-only">{WHO[index]}: </span>
        <span className={cn('block truncate text-sm text-ink', index === 0 && 'font-semibold')}>{entry.name}</span>
        <span className="block truncate text-xs text-ink-3">{entry.team}</span>
      </span>
    </td>
  )
}

function Pole({ row, className }) {
  if (!row.podium.length) return null
  let body, sr
  if (row.poleToWin) {
    sr = 'Won from pole'
    body = <span className="inline-flex min-h-6 items-center gap-pw-1 rounded-pill bg-steel-soft px-pw-3 text-xs font-medium text-steel"><Check size={12} aria-hidden="true" />Pole</span>
  } else if (row.winnerGrid === 0) {
    sr = 'Won from the pit lane'
    body = <span className="num text-ink-3">From pit lane</span>
  } else if (row.winnerGrid == null) {
    sr = 'Grid position unknown'
    body = <span className="num text-ink-3">n/a</span>
  } else {
    sr = `Won from P${row.winnerGrid}`
    body = <span className="num text-ink-3">From P{row.winnerGrid}</span>
  }
  return <td role="cell" className={cn('flex items-center px-pw-4 sm:px-pw-2', className)}><span aria-hidden="true">{body}</span><span className="sr-only">{sr}</span></td>
}

/**
 * Winners and podiums, newest season first. A real table with explicit roles; below 640px each row is a stacked grid
 * (the roles keep the table semantics when `display` is overridden). Every row is one link to the race page.
 */
export default function CircuitResultsTable({ rows, circuitName }) {
  if (!rows.length) return null
  return (
    <table role="table" className="block w-full">
      <caption className="sr-only">Results at {circuitName}, newest first</caption>
      <thead role="rowgroup" className="max-sm:sr-only sm:block">
        <tr role="row" className={cn('sm:grid sm:items-end sm:gap-x-pw-2 sm:border-b sm:border-edge sm:pb-pw-2', COLS)}>
          {['Season', 'Grand Prix', 'Winner', 'Second', 'Third', 'Pole'].map((h) => (
            <th key={h} role="columnheader" scope="col" className="px-pw-2 text-left text-xs font-medium text-ink-3">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody role="rowgroup" className="block divide-y divide-edge-soft">
        {rows.map((row) => {
          const label = `${row.raceName || 'Grand Prix'} ${row.season ?? ''}`.trim()
          const href = row.season != null && row.round != null ? `/races/${row.season}/${row.round}` : null
          return (
            <tr
              key={`${row.season}-${row.round}`} role="row" data-season={row.season}
              className={cn('relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-y-pw-2 py-pw-3 transition-colors duration-100 motion-reduce:transition-none sm:gap-x-pw-2 sm:py-0 sm:min-h-14 [@media(hover:hover)]:hover:bg-hover', COLS)}
            >
              <th role="rowheader" scope="row" className="px-pw-4 text-left font-normal max-sm:col-span-2 max-sm:row-start-1 sm:px-pw-2">
                {href ? (
                  <Link to={href} aria-label={label} className="text-ink no-underline outline-none after:absolute after:inset-0 focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-steel">
                    <span className="font-display text-lg font-semibold leading-none">{row.season}</span>
                  </Link>
                ) : <span className="font-display text-lg font-semibold leading-none text-ink">{row.season ?? 'n/a'}</span>}
                {row.round != null && <span className="num ml-pw-2 text-ink-3 sm:ml-0 sm:block">R{row.round}</span>}
              </th>
              <td role="cell" className="line-clamp-2 px-pw-4 text-sm text-ink max-sm:col-span-2 max-sm:row-start-2 sm:px-pw-2">{row.raceName}</td>
              {row.hasResult ? (
                <>
                  <Podium entry={row.podium[0]} index={0} className="max-sm:row-start-3" />
                  <Podium entry={row.podium[1]} index={1} className="max-sm:col-span-2 max-sm:row-start-4" />
                  <Podium entry={row.podium[2]} index={2} className="max-sm:col-span-2 max-sm:row-start-5" />
                  <Pole row={row} className="max-sm:col-start-2 max-sm:row-start-3" />
                </>
              ) : (
                <td role="cell" className="px-pw-4 text-sm text-ink-3 max-sm:col-span-2 sm:col-span-4 sm:px-pw-2">No result yet</td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
