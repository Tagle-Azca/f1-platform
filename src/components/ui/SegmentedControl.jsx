import { useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Segmented control built on the `.tab-bar` CSS classes (zero inline styles).
 * One component, two semantics:
 *   role="tablist"    each option is a tab (aria-selected); give `controls` (the panel id) and `idPrefix` (tab ids)
 *   role="radiogroup" each option is a radio (aria-checked)
 * Roving tabindex: only the selected option is a Tab stop. Arrow keys move AND select, Home/End jump.
 */
export default function SegmentedControl({
  options, value, onChange, role = 'tablist', controls, idPrefix, fill = false, className = '', ...rest
}) {
  const refs = useRef([])
  const isTabs = role === 'tablist'
  const selected = Math.max(0, options.findIndex(o => o.value === value))

  function move(to) {
    const i = (to + options.length) % options.length
    onChange(options[i].value)
    refs.current[i]?.focus()
  }

  function onKeyDown(e) {
    const keys = { ArrowRight: selected + 1, ArrowDown: selected + 1, ArrowLeft: selected - 1, ArrowUp: selected - 1, Home: 0, End: options.length - 1 }
    if (!Object.hasOwn(keys, e.key)) return
    e.preventDefault()
    move(keys[e.key])
  }

  return (
    <div role={role} className={cn('tab-bar tab-bar--plain', className)} onKeyDown={onKeyDown} {...rest}>
      {options.map((o, i) => {
        const on = i === selected
        const state = isTabs ? { role: 'tab', 'aria-selected': on, 'aria-controls': controls, id: idPrefix ? `${idPrefix}-${o.value}` : undefined }
          : { role: 'radio', 'aria-checked': on }
        return (
          <button
            key={o.value}
            ref={el => { refs.current[i] = el }}
            type="button"
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn('tab-bar__btn', on && 'tab-bar__btn--active', fill && 'flex-1')}
            {...state}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
