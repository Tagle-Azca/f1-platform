import { motion } from 'framer-motion'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'
import { sameTone, surname } from './teammatesModel'

const fmt = (v, unit) => (v === null ? '–' : `${v.toLocaleString('en-US')}${unit ?? ''}`)

/** Mirrored row: A's bar grows left from the label, B's grows right; each row is scaled to its own max. */
function Row({ row, colorA, colorB, dim, reduced, index }) {
  const max = Math.max(1, row.a ?? 0, row.b ?? 0)
  const pa = ((row.a ?? 0) / max) * 100
  const pb = ((row.b ?? 0) / max) * 100
  const anim = (w) => (reduced ? { initial: false } : { initial: { width: 0 }, animate: { width: w }, transition: { duration: DUR.bars, ease: EASE_OUT, delay: 0.1 + index * 0.05 } })
  const cls = (side) => (row.leader === side ? 'font-semibold text-ink' : 'text-ink-2')
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto_minmax(0,1fr)_3rem] items-center gap-x-pw-2 py-pw-1 md:grid-cols-[4rem_minmax(0,1fr)_9rem_minmax(0,1fr)_4rem]">
      <span className={`num text-left ${cls('a')}`}>{fmt(row.a, row.unit)}</span>
      <svg aria-hidden="true" viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full">
        <rect width="100" height="6" rx="1" fill="var(--viz-track)" />
        <g transform="translate(100 0) scale(-1 1)"><motion.rect height="6" rx="1" fill={colorA} width={pa} {...anim(pa)} /></g>
      </svg>
      <span className="px-pw-1 text-center text-xs text-ink-3">{row.label}</span>
      <svg aria-hidden="true" viewBox="0 0 100 6" preserveAspectRatio="none" className="h-1.5 w-full">
        <rect width="100" height="6" rx="1" fill="var(--viz-track)" />
        <motion.rect height="6" rx="1" fill={colorB} fillOpacity={dim ? 0.5 : 1} width={pb} {...anim(pb)} />
      </svg>
      <span className={`num text-right ${cls('b')}`}>{fmt(row.b, row.unit)}</span>
    </li>
  )
}

/** Career comparison: mirrored rows (decorative, aria-hidden) plus a screen-reader list that names the leader. */
export default function StatCompare({ rows, nameA, nameB, colorA, colorB }) {
  const reduced = useReducedMotion()
  const dim = sameTone(colorA, colorB)
  return (
    <section className="section min-w-0" aria-labelledby="teammates-compare-h">
      <h2 id="teammates-compare-h" className="text-heading mb-pw-3 text-ink">Career comparison</h2>
      <div className="mb-pw-2 flex justify-between text-xs text-ink-2" aria-hidden="true">
        <span>{surname(nameA)}</span><span>{surname(nameB)}</span>
      </div>
      <ul aria-hidden="true">
        {rows.map((r, i) => <Row key={r.key} row={r} colorA={colorA} colorB={colorB} dim={dim} reduced={reduced} index={i} />)}
      </ul>
      <ul className="sr-only">
        {rows.map((r) => (
          <li key={r.key}>
            {r.label}: {surname(nameA)} {fmt(r.a, r.unit)}, {surname(nameB)} {fmt(r.b, r.unit)}
            {r.leader === 'a' ? `. ${surname(nameA)} leads.` : r.leader === 'b' ? `. ${surname(nameB)} leads.` : r.leader === 'tie' ? '. Level.' : '.'}
          </li>
        ))}
      </ul>
    </section>
  )
}
