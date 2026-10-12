import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTweenedNumber } from '../../hooks/useTweenedNumber'
import { cn } from '@/lib/utils'

function Figure({ item }) {
  const shown = useTweenedNumber(item.value, { enterDuration: 320 })
  return (
    <div className="flex flex-col bg-bg px-pw-4 py-pw-3">
      <dd className="order-1 m-0 text-stat text-ink">
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{item.value}</span>
      </dd>
      <dt className="order-2 mt-pw-1 text-xs text-ink-3">{item.label}</dt>
    </div>
  )
}

function Detail({ item }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-3">{item.label}</dt>
      <dd className="m-0 flex items-center gap-pw-1">
        {item.dir === 'gained' && <ArrowUp aria-hidden="true" size={12} strokeWidth={2.5} className="text-pos" />}
        {item.dir === 'lost' && <ArrowDown aria-hidden="true" size={12} strokeWidth={2.5} className="text-neg" />}
        <span className="num text-[15px] font-medium text-ink">{item.text}</span>
        {item.dir === 'gained' && <span className="sr-only"> places gained per race</span>}
        {item.dir === 'lost' && <span className="sr-only"> places lost per race</span>}
        {item.sr && <span className="sr-only">. {item.sr}</span>}
      </dd>
    </div>
  )
}

/**
 * Totals block shared by both profiles: four primary figures (hairline cross at 375, four across from md; they count up
 * once) and a secondary list. `footnote` is the visible definition line under the list. Data not finite is already
 * omitted by the model, so a missing figure never renders as 0.
 */
export default function StatStrip({ id, title = 'Totals since 2022', caption, primary, secondary, footnote, className = '' }) {
  const fillers = primary.length ? (4 - (primary.length % 4)) % 4 : 0
  return (
    <section className={cn('section', className)} aria-labelledby={id}>
      <h2 id={id} className="text-heading text-ink">{title}</h2>
      {caption && <p className="mt-pw-1 text-xs text-ink-3">{caption}</p>}
      {primary.length > 0 && (
        <dl className="m-0 mt-pw-4 grid grid-cols-2 gap-px bg-edge-soft md:grid-cols-4" data-stat-primary>
          {primary.map((p) => <Figure key={p.key} item={p} />)}
          {Array.from({ length: fillers }, (_, i) => <div key={`f${i}`} aria-hidden="true" className="bg-bg" />)}
        </dl>
      )}
      {secondary.length > 0 && (
        <dl className="m-0 mt-pw-5 grid grid-cols-2 gap-x-pw-6 gap-y-pw-4 md:grid-cols-3" data-stat-secondary>
          {secondary.map((s) => <Detail key={s.key} item={s} />)}
        </dl>
      )}
      {footnote && <p className="mt-pw-3 text-xs text-ink-3">{footnote}</p>}
    </section>
  )
}
