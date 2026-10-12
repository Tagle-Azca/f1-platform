/** StatLine — label on the left, value (and optional extra) on the right. Used in spec/recap lists. */
export default function StatLine({ label, value, extra, valueClassName = 'text-ink', hint }) {
  return (
    <div className="flex items-baseline gap-pw-3 min-h-10 py-pw-2 border-b border-edge-soft last:border-b-0">
      <dt className="w-24 shrink-0 text-xs text-ink-3">{label}{hint && <span aria-hidden="true">*</span>}</dt>
      <dd className={`min-w-0 flex-1 truncate text-sm font-semibold tabular-nums ${valueClassName}`}>{value}</dd>
      {extra && <dd className="shrink-0 font-mono text-xs text-ink-2 tabular-nums">{extra}</dd>}
    </div>
  )
}
