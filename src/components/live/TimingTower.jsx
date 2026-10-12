import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TyreBadge from '../ui/TyreBadge'
import GapBar from '../viz/GapBar'
import TeamBar from '../viz/TeamBar'
import { classifyGap, useGapMax, RACE_STEPS, TIMED_STEPS } from '../viz/gapScale'
import { sectorTone } from '../../styles/vizPalette'
import { asObjectArray } from '../../utils/safeArray'
import { normalizeRow } from './normalizeRow'

const GLYPH = { diamond: '◆', circle: '●', dash: '–' }

function Sectors({ sectors }) {
  const list = asObjectArray(sectors)
  if (!list.some(s => s.value)) return <span className="text-ink-3">—</span>
  return (
    <span className="inline-flex gap-pw-3 whitespace-nowrap">
      {list.map((s, i) => {
        const tone = sectorTone(s.status)
        return (
          <span key={i} className={`num whitespace-nowrap text-xs ${tone?.cls ?? 'text-ink-2'}`}>
            {tone && <span aria-hidden="true" className="mr-0.5 text-[10px]">{GLYPH[tone.glyph]}</span>}
            S{i + 1} {s.value || '—'}
            {tone && <span className="sr-only"> ({tone.hint})</span>}
          </span>
        )
      })}
    </span>
  )
}

function GapCell({ d, gap, isRaceType, max }) {
  if (gap.kind === 'leader') return <span className="font-semibold text-signal-yellow">{isRaceType ? 'Leader' : 'Fastest'}</span>
  const value = d.stat
  const extra = d.statLabel && d.statLabel !== 'gap' && d.statLabel !== 'fastest' ? d.statLabel : null
  return (
    <span className="flex w-full items-center gap-pw-2">
      {gap.kind === 'gap' && <GapBar value={gap.seconds} max={max} color={d.teamColor} className="min-w-6 flex-1" animate={false} />}
      {gap.kind === 'lapped' && <GapBar value={0} max={max} lapped={gap.laps} className="min-w-6 flex-1" animate={false} />}
      {gap.kind === 'none' && <span className="flex-1" />}
      <span className="flex min-w-[4.75rem] shrink-0 flex-col items-end leading-tight">
        {value && <span className="num whitespace-nowrap text-ink">{value}</span>}
        {extra && <span className="num whitespace-nowrap text-xs text-ink-2">{extra}</span>}
      </span>
    </span>
  )
}

const Row = memo(function Row({ driver: d, gap, max, isRaceType, showTyre, expanded, expandable, onToggle }) {
  const top3 = Number(d.position) <= 3
  const cols = 4 + (showTyre ? 1 : 0)
  const tyre = showTyre && <td className="px-pw-1 text-center"><TyreBadge compound={d.compound} /></td>
  return (
    <>
      <tr
        data-num={d.driverNum}
        onClick={expandable ? () => onToggle(d.driverNum) : undefined}
        className={`h-12 border-b border-edge-soft ${expandable ? 'cursor-pointer [@media(hover:hover)]:hover:bg-hover' : ''}`}
      >
        <td data-cell="pos" className={`flash-cell num w-12 border-l-2 pl-pw-2 text-center text-base font-medium text-ink ${top3 ? 'border-ink-3' : 'border-transparent'}`}>
          {d.retired ? <span className="text-xs text-ink-2">OUT</span> : d.position}
        </td>
        <th scope="row" className="py-0 pr-pw-3 text-left font-normal">
          {expandable ? (
            <button type="button" aria-expanded={expanded} className="flex min-h-12 w-full items-center gap-pw-2 border-0 bg-transparent text-left text-ink cursor-pointer">
              <Identity d={d} />
              <span className="sr-only">{expanded ? 'Hide' : 'Show'} details for {d.fullName || d.acronym}</span>
            </button>
          ) : (
            <div className="flex min-h-12 items-center gap-pw-2"><Identity d={d} /></div>
          )}
        </th>
        {expandable && tyre}
        {!expandable && <td className="num pr-pw-3 text-right text-ink-2">{d.lastLap ?? '—'}</td>}
        {!expandable && <td className="pr-pw-3"><Sectors sectors={d.sectors} /></td>}
        <td data-cell="gap" className="flash-cell min-w-[9.5rem] pl-pw-2 pr-pw-3 text-sm md:min-w-[11rem]"><GapCell d={d} gap={gap} isRaceType={isRaceType} max={max} /></td>
        {!expandable && tyre}
        {!expandable && (
          <td className="pr-pw-3 whitespace-nowrap text-xs font-semibold text-signal-orange">{isRaceType && d.inPit ? 'In pit' : ''}</td>
        )}
        {expandable && (
          <td aria-hidden="true" className="w-8 pr-pw-2 text-ink-3">
            <ChevronDown className={`size-4 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
          </td>
        )}
      </tr>
      {expandable && expanded && (
        <tr className="border-b border-edge-soft bg-hover">
          <td />
          <td colSpan={cols} className="py-pw-2 pr-pw-3">
            <dl className="grid grid-cols-[auto_1fr] gap-x-pw-3 gap-y-1 text-sm">
              <dt className="text-ink-3">Team</dt><dd className="text-ink">{d.teamName || '—'}</dd>
              <dt className="text-ink-3">Last lap</dt><dd className="num text-ink">{d.lastLap ?? '—'}</dd>
              <dt className="text-ink-3">Sectors</dt><dd><Sectors sectors={d.sectors} /></dd>
              {isRaceType && <><dt className="text-ink-3">Pit</dt><dd className="text-ink">{d.inPit ? 'In pit now' : 'On track'}</dd></>}
            </dl>
          </td>
        </tr>
      )}
    </>
  )
})

function Identity({ d }) {
  return (
    <>
      <TeamBar color={d.teamColor} />
      <span className="min-w-0 max-w-24 md:max-w-48">
        <span className="block truncate font-display text-base font-semibold leading-none tracking-[0.02em] text-ink">{d.acronym}</span>
        <span className="hidden truncate text-xs text-ink-3 md:block">{d.fullName}</span>
      </span>
    </>
  )
}

const FLASH_MS = 800
const MAX_FLASH_ROWS = 8

/**
 * Value flash: after a poll, changed gap cells flash neutral and changed position cells flash gain or loss.
 * Toggled with a data-flash attribute (no per-row React state), never on first render, skipped when more
 * than 8 rows change at once, and skipped entirely for reduced motion. Never announced.
 */
function useValueFlash(tableRef, rows) {
  const prev = useRef(null)
  const timers = useRef(new Set())
  useEffect(() => {
    const table = tableRef.current
    const snapshot = new Map(rows.map(r => [r.driverNum, { pos: Number(r.position), stat: r.stat }]))
    const before = prev.current
    prev.current = snapshot
    if (!before || !table) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const changes = []
    for (const [num, now] of snapshot) {
      const was = before.get(num)
      if (!was) continue
      if (was.pos !== now.pos) changes.push([num, 'pos', now.pos < was.pos ? 'gain' : 'loss'])
      else if (was.stat !== now.stat) changes.push([num, 'gap', 'neutral'])
    }
    if (!changes.length || changes.length > MAX_FLASH_ROWS) return
    for (const [num, cell, kind] of changes) {
      const el = table.querySelector(`tr[data-num="${CSS.escape(String(num))}"] [data-cell="${cell}"]`)
      if (!el) continue
      el.removeAttribute('data-flash')
      void el.offsetWidth // restart the animation
      el.setAttribute('data-flash', kind)
      const t = setTimeout(() => { el.removeAttribute('data-flash'); timers.current.delete(t) }, FLASH_MS)
      timers.current.add(t)
    }
  }, [rows, tableRef])
  useEffect(() => {
    const set = timers.current
    return () => { set.forEach(clearTimeout); set.clear() }
  }, [])
}

/**
 * Timing tower: a real <table> with no wrapper (so the header can stick). Below md it shows
 * Pos | Driver | Tyre | Gap | chevron and each row expands for last lap / sectors / pit.
 * From md all columns are visible and nothing expands. `stale` dims bars and tyre discs only.
 */
export default function TimingTower({ classification: rawClassification, isRaceType, expandable, stale = false, sessionKey = '' }) {
  const classification = useMemo(() => asObjectArray(rawClassification).map(normalizeRow), [rawClassification])
  const [openNum, setOpenNum] = useState(null)
  const toggle = useCallback((num) => setOpenNum(prev => (prev === num ? null : num)), [])
  // Feed rows can repeat or lack a driverNum: keep React keys unique without changing normal keys.
  const keys = useMemo(() => { const seen = new Set(); return classification.map((d, i) => { let k = d.driverNum || `row-${i}`; if (seen.has(k)) k = `${k}~${i}`; seen.add(k); return k }) }, [classification])
  const showTyre = classification.some(d => d.compound)
  const tableRef = useRef(null)
  const gaps = useMemo(() => classification.map(d => classifyGap(d, isRaceType)), [classification, isRaceType])
  const needed = Math.max(0, ...gaps.filter(g => g.kind === 'gap').map(g => g.seconds))
  const max = useGapMax(needed, isRaceType ? RACE_STEPS : TIMED_STEPS, `${sessionKey}|${isRaceType}`)
  useValueFlash(tableRef, classification)

  return (
    <table ref={tableRef} data-stale={stale ? 'true' : undefined} className="w-full border-collapse border-t border-edge text-sm">
      <caption className="sr-only">Live classification</caption>
      <thead className="sticky top-header z-10 bg-bg text-xs font-medium text-ink-3">
        <tr className="border-b border-edge">
          <th scope="col" className="h-9 w-12 pl-pw-2 pr-pw-2 text-center font-medium">Pos</th>
          <th scope="col" className="pl-pw-2 text-left font-medium">Driver</th>
          {expandable && showTyre && <th scope="col" className="px-pw-1 text-center font-medium">Tyre</th>}
          {!expandable && <th scope="col" className="pr-pw-3 text-right font-medium">Last lap</th>}
          {!expandable && <th scope="col" className="pr-pw-3 text-left font-medium">Sectors</th>}
          <th scope="col" className="pr-pw-3 text-right font-medium">{isRaceType ? 'Gap' : 'Best lap'}</th>
          {!expandable && showTyre && <th scope="col" className="pr-pw-3 text-center font-medium">Tyre</th>}
          {!expandable && <th scope="col" className="pr-pw-3 text-left font-medium"><span className="sr-only">Pit</span></th>}
          {expandable && <th scope="col" className="w-8"><span className="sr-only">Expand</span></th>}
        </tr>
      </thead>
      <tbody>
        {classification.map((d, i) => (
          <Row
            key={keys[i]}
            driver={d}
            gap={gaps[i]}
            max={max}
            isRaceType={isRaceType}
            showTyre={showTyre}
            expandable={expandable}
            expanded={openNum === d.driverNum}
            onToggle={toggle}
          />
        ))}
      </tbody>
    </table>
  )
}
