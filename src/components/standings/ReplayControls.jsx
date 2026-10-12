import { useId } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Sticky replay bar: play/pause, round scrubber (native range) and the round label.
 * The scrubber's valueText ("After round 12, British GP") is the accessible value; the visible label is not a live region.
 * Must be a direct child of the tab panel so `position: sticky` has the whole panel to stick within.
 */
export default function ReplayControls({
  round, total, playing, atEnd, onToggle, onSeek, valueText, compactLabel, longLabel, sticky = true,
}) {
  const helpId = useId()
  const disabled = total < 2
  const pct = total > 1 ? ((round - 1) / (total - 1)) * 100 : 100
  const name = playing ? 'Pause replay' : atEnd ? 'Replay season' : 'Play replay'
  const Icon = playing ? Pause : atEnd ? RotateCcw : Play

  function onKeyDown(e) {
    if (e.key !== 'PageUp' && e.key !== 'PageDown') return
    e.preventDefault()
    onSeek(round + (e.key === 'PageUp' ? 5 : -5))
  }

  return (
    <div
      role="group"
      aria-label="Season replay"
      className={cn(
        'z-20 flex h-14 items-center gap-pw-3 border-b border-edge bg-bg',
        sticky && 'sticky top-[var(--header-height)]',
      )}
    >
      <button
        type="button"
        aria-label={name}
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? helpId : undefined}
        onClick={disabled ? undefined : onToggle}
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-steel text-bg transition-transform duration-100 active:translate-y-px active:scale-[0.98] aria-disabled:cursor-default aria-disabled:opacity-60"
      >
        <Icon aria-hidden="true" size={20} strokeWidth={2} />
      </button>
      <div className="min-w-0 flex-1 px-pw-2">
        <input
          type="range"
          className="replay-range"
          min={1}
          max={Math.max(total, 1)}
          step={1}
          value={Math.min(Math.max(round, 1), Math.max(total, 1))}
          aria-label="Replay round"
          aria-valuetext={valueText}
          aria-disabled={disabled || undefined}
          aria-describedby={disabled ? helpId : undefined}
          style={{ '--pct': `${pct}%` }}
          onChange={(e) => (disabled ? undefined : onSeek(Number(e.target.value)))}
          onKeyDown={onKeyDown}
        />
      </div>
      <span aria-hidden="true" className="shrink-0 text-right">
        <span className="num text-ink md:hidden">{compactLabel}</span>
        <span className="hidden max-w-64 truncate text-sm text-ink-2 md:inline-block">{longLabel}</span>
      </span>
      {disabled && <span id={helpId} className="sr-only">Needs at least two rounds</span>}
    </div>
  )
}
