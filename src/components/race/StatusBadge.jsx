import { statusWord } from './resultsModel'
import { cn } from '@/lib/utils'

const TONE = { ok: 'text-ink-2', plain: 'text-ink-2', bad: 'text-neg', none: 'text-ink-3' }

/** Status as a word in a hairline pill (give the raw API `status`, or an already mapped `word`). DNF and DSQ are the only red ones; the word carries the meaning. */
export default function StatusBadge({ status, word, className = '' }) {
  const { label, tone } = word ?? statusWord(status)
  if (tone === 'none') return <span className={cn('text-xs text-ink-3', className)}>-</span>
  return (
    <span className={cn('inline-flex min-h-6 items-center whitespace-nowrap rounded-pill border border-edge px-pw-2 text-xs', TONE[tone], className)}>
      {label}
    </span>
  )
}
