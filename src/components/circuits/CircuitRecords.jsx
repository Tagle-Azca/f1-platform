import { recordItems } from './circuitUiModel'

/** Hairline three-up strip (the spec-strip pattern), one shared footnote underneath. */
export default function CircuitRecords({ records }) {
  const items = recordItems(records)
  return (
    <div>
      <dl className="grid divide-y divide-edge-soft sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-y-0">
        {items.map((it, i) => (
          <div key={it.label} className={`min-w-0 py-pw-3 sm:py-0 ${i === 0 ? 'sm:pr-pw-4' : 'sm:px-pw-4'}`}>
            <dt className="text-xs text-ink-3">{it.label}</dt>
            <dd className={`text-stat ${it.value === 'n/a' ? 'text-ink-3' : 'text-ink'}`}>
              {it.value}{it.unit && <span className="ml-1 text-sm font-medium text-ink-3">{it.unit}</span>}
            </dd>
            <dd className="mt-pw-1 text-sm text-ink-2 [overflow-wrap:anywhere]">{it.detail}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-pw-3 text-xs text-ink-3">Within 2022 to 2026 race data.</p>
    </div>
  )
}
