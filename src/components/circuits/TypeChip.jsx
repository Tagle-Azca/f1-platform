import { TYPE_LABELS } from './constants'

/** Circuit class chip: the tone is a dot (graphic), the word stays ink-2 text. */
export default function TypeChip({ type, className = '' }) {
  return (
    <span data-type={type} className={`inline-flex min-h-6 items-center gap-pw-2 rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2 ${className}`}>
      <span aria-hidden="true" className="type-dot" />
      {TYPE_LABELS[type] ?? TYPE_LABELS.permanent}
    </span>
  )
}
