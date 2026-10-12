import { Dialog } from '@base-ui/react/dialog'
import { SlidersHorizontal, X } from 'lucide-react'
import Select from '../ui/Select'
import SegmentedControl from '../ui/SegmentedControl'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { CalendarToggle, Field } from './CircuitsToolbar'
import { TYPE_OPTIONS, regionOptions, sortOptions } from './circuitUiModel'

/**
 * Below 640px the region, type, calendar and sort controls live in this bottom sheet (Base UI Dialog:
 * focus trapped, Esc and backdrop close, focus returns to the trigger). Controls apply immediately.
 */
export default function FiltersSheet({ state, regions, hasCalendar, season, disabled, activeCount, count, canClear, onChange, onClear }) {
  const label = activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'
  const none = count === 0
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={label}
        className="inline-flex min-h-11 min-w-28 cursor-pointer items-center justify-center gap-pw-2 rounded-md border border-edge bg-panel px-pw-3 text-sm font-medium text-ink hover:border-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel"
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span aria-hidden="true">Filters</span>
        {activeCount > 0 && <span aria-hidden="true" className="num inline-flex min-h-5 min-w-5 items-center justify-center rounded-pill bg-steel px-pw-1 text-xs text-bg">{activeCount}</span>}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-bg/70 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup
          initialFocus={() => document.getElementById('cs-sheet-region')}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col rounded-t-[12px] border-t border-edge bg-panel outline-none transition-transform duration-[280ms] ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none"
        >
          <div className="flex items-center justify-between gap-pw-3 px-pw-4 pt-pw-3">
            <Dialog.Title className="text-heading text-ink">Filters</Dialog.Title>
            <Dialog.Close aria-label="Close filters" className="flex size-11 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-ink-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel">
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-pw-4 overflow-y-auto overscroll-contain px-pw-4 py-pw-3">
            <Field id="cs-sheet-region" label="Region">
              <Select id="cs-sheet-region" value={state.region} onChange={(region) => onChange({ region })} options={regionOptions(regions)} disabled={disabled} />
            </Field>
            <div className="flex flex-col gap-pw-1">
              <span id="cs-sheet-type-label" className="text-xs text-ink-2">Type</span>
              <SegmentedControl
                role="radiogroup" aria-labelledby="cs-sheet-type-label" options={TYPE_OPTIONS} value={state.type}
                onChange={(type) => onChange({ type })} className="grid grid-cols-2"
              />
            </div>
            {hasCalendar && <CalendarToggle row season={season} pressed={state.cal} onToggle={(cal) => onChange({ cal })} disabled={disabled} />}
            <Field id="cs-sheet-sort" label="Sort">
              <Select id="cs-sheet-sort" value={state.sort} onChange={(sort) => onChange({ sort })} options={sortOptions(hasCalendar)} disabled={disabled} />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-pw-3 border-t border-edge-soft px-pw-4 py-pw-3">
            <button
              type="button" aria-disabled={!canClear || undefined} onClick={() => { if (canClear) onClear() }}
              className={cn('min-h-11 cursor-pointer border-0 bg-transparent px-pw-1 text-sm font-semibold text-steel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel', !canClear && 'cursor-not-allowed opacity-60')}
            >
              Clear filters
            </button>
            {none ? (
              <button type="button" aria-disabled="true" className={cn(buttonVariants(), 'cursor-not-allowed')}>No circuits match</button>
            ) : (
              <Dialog.Close className={cn(buttonVariants(), 'cursor-pointer')}>Show {count} {count === 1 ? 'circuit' : 'circuits'}</Dialog.Close>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
