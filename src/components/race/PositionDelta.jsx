import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Places gained or lost from the grid: arrow and number (the row's spoken summary carries the words). null = unknown. */
export default function Delta({ value, className = '' }) {
  if (value === null || value === undefined) return <span aria-hidden="true" className={cn('text-xs text-ink-3', className)}>-</span>
  if (value === 0) return <span aria-hidden="true" className={cn('inline-block size-1.5 rounded-pill bg-ink-3', className)} />
  const Icon = value > 0 ? ArrowUp : ArrowDown
  return (
    <span aria-hidden="true" className={cn('inline-flex items-center gap-0.5 text-xs', value > 0 ? 'text-pos' : 'text-neg', className)}>
      <Icon size={12} strokeWidth={2.5} />
      <span className="num">{Math.abs(value)}</span>
    </span>
  )
}
