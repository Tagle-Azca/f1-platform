import { Select as S } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'

// Base UI uses null for "nothing selected"; callers keep using '' like a native <select>
const toKey = (v) => (v === '' || v == null ? null : v)

/**
 * Styled single-value select (Base UI): trigger matches the inputs, popup matches the
 * time-zone picker (panel, edge border, steel for the selected row). Keyboard, typeahead
 * and screen-reader semantics come from Base UI.
 *
 * Props:
 *   id           string  — pair with <label htmlFor>
 *   value        string  — '' means nothing selected
 *   onChange     (value: string) => void
 *   options      Array<{ value: string, label: string }> — a '' value is a selectable "none" row
 *   placeholder  string  — shown when nothing is selected and no '' option exists
 */
export default function Select({ id, value, onChange, options, placeholder = 'Select', disabled = false, className = '', ...rest }) {
  const items = options.map(o => ({ value: toKey(o.value), label: o.label }))

  return (
    <S.Root items={items} value={toKey(value)} onValueChange={v => onChange(v ?? '')} disabled={disabled}>
      <S.Trigger
        id={id}
        className={[
          'group flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-pw-2 rounded-md border border-edge bg-panel px-pw-3 text-left text-sm font-medium text-ink',
          'hover:border-ink-3 data-[popup-open]:border-steel',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 data-[disabled]:hover:border-edge md:min-h-9',
          className,
        ].join(' ')}
        {...rest}
      >
        <S.Value placeholder={placeholder} className="min-w-0 truncate data-[placeholder]:text-ink-3" />
        <S.Icon className="flex shrink-0 text-ink-3 transition-transform duration-150 group-data-[popup-open]:rotate-180 motion-reduce:transition-none">
          <ChevronDown size={16} aria-hidden="true" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[60] outline-none">
          <S.Popup
            className={[
              'max-h-[min(var(--available-height),20rem)] min-w-[var(--anchor-width)] overflow-y-auto rounded-md border border-edge bg-panel py-pw-1 shadow-float outline-none',
              'origin-[var(--transform-origin)] transition-[opacity,transform] duration-150 motion-reduce:transition-none',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
            ].join(' ')}
          >
            {items.map(it => (
              <S.Item
                key={it.value ?? '__none__'}
                value={it.value}
                className="flex min-h-11 cursor-pointer select-none items-center gap-pw-2 px-pw-3 text-sm text-ink-2 outline-none data-[highlighted]:bg-hover data-[highlighted]:text-ink data-[selected]:font-semibold data-[selected]:text-steel md:min-h-9"
              >
                <S.ItemText className="min-w-0 flex-1 truncate">{it.label}</S.ItemText>
                <S.ItemIndicator className="flex shrink-0">
                  <Check size={14} aria-hidden="true" />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Popup>
        </S.Positioner>
      </S.Portal>
    </S.Root>
  )
}
