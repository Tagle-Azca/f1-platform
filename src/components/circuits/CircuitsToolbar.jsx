import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import Select from '../ui/Select'
import SegmentedControl from '../ui/SegmentedControl'
import { TYPE_OPTIONS, sortOptions, regionOptions } from './circuitUiModel'

const VIEW_OPTIONS = [{ value: 'grid', label: 'Grid' }, { value: 'map', label: 'Map' }]
export function Field({ id, label, className = '', children }) {
  return (
    <div className={`flex min-w-0 flex-col gap-pw-1 ${className}`}>
      <label htmlFor={id} className="text-xs text-ink-2">{label}</label>
      {children}
    </div>
  )
}

/** On/off filter button. `aria-pressed` plus a check mark or an empty circle, so state is never colour alone. */
export function CalendarToggle({ season, pressed, onToggle, disabled, row = false, id }) {
  return (
    <button
      type="button" id={id} aria-pressed={pressed} aria-disabled={disabled || undefined}
      onClick={() => { if (!disabled) onToggle(!pressed) }}
      className={[
        'inline-flex min-h-11 items-center gap-pw-2 rounded-md border px-pw-3 text-sm font-medium transition-colors duration-150 md:min-h-9 motion-reduce:transition-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel',
        pressed ? 'border-transparent bg-steel-soft text-steel' : 'border-edge bg-panel text-ink-2 [@media(hover:hover)]:hover:border-ink-3',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        row ? 'w-full justify-between' : '',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-pw-2">
        {pressed ? <Check size={14} aria-hidden="true" /> : <span aria-hidden="true" className="size-[14px] rounded-full border border-ink-3" />}
        On {season} calendar
      </span>
      {row && <span className="text-xs text-ink-3">{pressed ? 'On' : 'Off'}</span>}
    </button>
  )
}

/** Controlled search box; the URL write is debounced by the parent, the text stays local. */
export function SearchBox({ value, onChange, disabledClear = false }) {
  // Follow the URL when it changes underneath us (Clear filters, Back), without fighting the user's typing
  const [seen, setSeen] = useState(value)
  const [text, setText] = useState(value)
  if (seen !== value) { setSeen(value); setText(value) }
  const set = (v) => { setText(v); onChange(v) }
  return (
    <div className="flex min-w-0 flex-col gap-pw-1">
      <label htmlFor="cs-search" className="text-xs text-ink-2">Search</label>
      <div className="relative">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-pw-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          id="cs-search" type="search" value={text} placeholder="Circuit, city or country" autoComplete="off" maxLength={60}
          onChange={(e) => set(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape' && text) { e.preventDefault(); set('') } }}
          className="min-h-11 w-full rounded-md border border-edge bg-panel pl-9 pr-11 text-sm text-ink hover:border-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel md:min-h-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {text && !disabledClear && (
          <button
            type="button" aria-label="Clear search" onClick={() => set('')}
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-ink-3 hover:text-ink md:size-9"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Desktop toolbar (from 640px): search + view, then region, type, calendar toggle and sort.
 * Below 640px the parent renders only search, view and the Filters button (see CircuitsPage).
 */
export default function CircuitsToolbar({ state, regions, hasCalendar, season, disabled, onChange, onSearch }) {
  return (
    <div className="flex flex-col gap-pw-4">
      <div className="flex items-end justify-between gap-pw-4">
        <div className="w-full max-w-sm"><SearchBox value={state.q} onChange={onSearch} /></div>
        <ViewControl value={state.view} onChange={(view) => onChange({ view })} className="w-44 shrink-0" />
      </div>
      <div className="flex flex-wrap items-end gap-x-pw-3 gap-y-pw-3">
        <Field id="cs-region" label="Region" className="w-[9.5rem]">
          <Select id="cs-region" value={state.region} onChange={(region) => onChange({ region })} options={regionOptions(regions)} disabled={disabled} />
        </Field>
        <div className="flex min-w-0 flex-col gap-pw-1">
          <span id="cs-type-label" className="text-xs text-ink-2">Type</span>
          <SegmentedControl
            role="radiogroup" aria-labelledby="cs-type-label" options={TYPE_OPTIONS} value={state.type}
            onChange={(type) => onChange({ type })} className="[&_.tab-bar__btn]:px-pw-3"
          />
        </div>
        {hasCalendar && <CalendarToggle season={season} pressed={state.cal} onToggle={(cal) => onChange({ cal })} disabled={disabled} />}
        <Field id="cs-sort" label="Sort" className="ml-auto w-[9.5rem]">
          <Select id="cs-sort" value={state.sort} onChange={(sort) => onChange({ sort })} options={sortOptions(hasCalendar)} disabled={disabled} />
        </Field>
      </div>
    </div>
  )
}

export function ViewControl({ value, onChange, className = '' }) {
  return (
    <SegmentedControl
      role="tablist" aria-label="View" options={VIEW_OPTIONS} value={value} onChange={onChange}
      controls="circuits-panel" idPrefix="circuits-tab" fill className={className}
    />
  )
}
