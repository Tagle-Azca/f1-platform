import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { searchApi } from '../../services/api'
import { splitMatch } from '../encyclopedia/encyclopediaModel'
import { isValidEntityId } from '../profiles/entityId'
import { safeString } from '../../utils/safeText'
import { cn } from '@/lib/utils'

export const SEARCH_DEBOUNCE_MS = 250
export const SEARCH_MIN_CHARS = 2
const MAX_OPTIONS = 8

function Highlight({ label, query }) {
  const [pre, hit, post] = splitMatch(label, query)
  return <>{pre}{hit && <span className="font-semibold">{hit}</span>}{post}</>
}

function SkeletonRows() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex min-h-11 items-center gap-pw-3 px-pw-3">
          <div className="viz-pulse h-3.5 w-3/5 rounded-[2px] bg-edge-soft" />
        </div>
      ))}
    </div>
  )
}

function toOptions(rows, exclude) {
  const seen = new Set()
  const out = []
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || r.type !== 'driver') continue
    const id = safeString(r.id)
    const label = safeString(r.label).trim()
    if (!label || !isValidEntityId(id) || exclude.includes(id) || seen.has(id)) continue
    seen.add(id)
    out.push({ driverId: id, name: label, nationality: safeString(r.nationality) })
    if (out.length >= MAX_OPTIONS) break
  }
  return out
}

/**
 * Driver picker (WAI-ARIA combobox): the input keeps focus while arrows move aria-activedescendant over the options.
 * 250ms debounce, 2+ characters, newer query wins over a slower earlier one. Picking calls onPick({ driverId, name, nationality })
 * and clears the field. Typing never touches the URL.
 */
export default function DriverCombobox({ id, label, placeholder = 'Search drivers', exclude = [], onPick, autoFocus = false, highlight = false }) {
  const listId = useId()
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const seq = useRef(0)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [attempt, setAttempt] = useState(0)
  const [res, setRes] = useState({ status: 'idle', options: [], q: '' })
  const [message, setMessage] = useState('')
  const excludeKey = exclude.join(',')

  const q = query.trim()
  const enabled = q.length >= SEARCH_MIN_CHARS

  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])

  useEffect(() => {
    if (!enabled) { seq.current += 1; return undefined }
    const mine = ++seq.current
    const t = setTimeout(() => {
      setRes((r) => ({ ...r, status: 'loading' }))
      Promise.resolve().then(() => searchApi.search(q, 20)).then(
        (rows) => {
          if (mine !== seq.current) return
          const options = toOptions(rows, excludeKey ? excludeKey.split(',') : [])
          setRes({ status: 'ready', options, q })
          setActive(-1)
          setMessage(options.length ? `${options.length} ${options.length === 1 ? 'driver' : 'drivers'} found` : 'No drivers found')
        },
        () => {
          if (mine !== seq.current) return
          setRes((r) => ({ status: 'error', options: [], q: r.q }))
          setMessage('Search failed')
        },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [q, enabled, attempt, excludeKey])

  const options = enabled ? res.options : []
  const hasItems = enabled && options.length > 0
  const expanded = open && hasItems
  const showPanel = open && enabled && res.status !== 'idle'
  const loadingFresh = res.status === 'loading' && options.length === 0
  const optId = (i) => `${listId}-opt-${i}`

  const move = useCallback((to) => {
    if (!options.length) return
    setActive(((to % options.length) + options.length) % options.length)
  }, [options.length])

  function pick(o) {
    setQuery(''); setOpen(false); setActive(-1)
    setRes({ status: 'idle', options: [], q: '' })
    onPick(o)
  }

  function onKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) setOpen(true); move(active < 0 ? 0 : active + 1); break
      case 'ArrowUp': e.preventDefault(); if (!open) setOpen(true); move(active < 0 ? options.length - 1 : active - 1); break
      case 'Home':
      case 'End':
        if (expanded && active >= 0) { e.preventDefault(); move(e.key === 'Home' ? 0 : options.length - 1) }
        break
      case 'Enter':
        if (expanded && active >= 0) { e.preventDefault(); pick(options[active]) }
        break
      case 'Escape':
        if (open && showPanel) { e.preventDefault(); setOpen(false); setActive(-1) } else if (query) { e.preventDefault(); setQuery('') }
        break
      default:
    }
  }

  function onBlur(e) {
    if (wrapRef.current?.contains(e.relatedTarget)) return
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative w-full" onBlur={onBlur}>
      <label htmlFor={id} className="mb-pw-1 block text-xs text-ink-2">{label}</label>
      <div className="relative">
        <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-pw-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          ref={inputRef} id={id} type="text" role="combobox" autoComplete="off" spellCheck={false} maxLength={60}
          aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-autocomplete="list" aria-haspopup="listbox"
          aria-activedescendant={expanded && active >= 0 ? optId(active) : undefined} aria-busy={res.status === 'loading' || undefined}
          placeholder={placeholder} value={query}
          onChange={(e) => { setQuery(e.target.value.slice(0, 60)); setOpen(true); setActive(-1) }}
          onKeyDown={onKeyDown} onFocus={() => { if (enabled) setOpen(true) }}
          className={cn('min-h-11 w-full rounded-md border bg-panel pl-9 pr-11 text-sm text-ink hover:border-ink-3', highlight ? 'border-steel' : 'border-edge')}
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setActive(-1); inputRef.current?.focus() }} className="absolute right-0 top-1/2 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent text-ink-3 hover:text-ink">
            <X aria-hidden="true" size={16} />
          </button>
        )}
      </div>

      {showPanel && (
        <div onMouseDown={(e) => e.preventDefault()} className="absolute left-0 top-full z-[60] mt-pw-2 max-h-[min(20rem,60svh)] w-full overflow-y-auto overscroll-contain rounded-md border border-edge bg-panel shadow-float">
          {loadingFresh && <SkeletonRows />}
          {res.status === 'error' && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-pw-2 px-pw-3 py-pw-3">
              <p className="text-sm text-ink-2">Search isn&apos;t available right now.</p>
              <button type="button" onClick={() => { setRes((r) => ({ ...r, status: 'loading' })); setAttempt((n) => n + 1) }} className="inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-sm font-semibold text-steel hover:text-steel-hi">Try again</button>
            </div>
          )}
          {res.status === 'ready' && !hasItems && (
            <p className="px-pw-3 py-pw-3 text-sm text-ink">No matches for &ldquo;{res.q}&rdquo;.</p>
          )}
          {hasItems && (
            <ul id={listId} role="listbox" aria-label={`${label} results`} className="py-pw-1">
              {options.map((o, i) => (
                <li
                  key={o.driverId} id={optId(i)} role="option" aria-selected={i === active}
                  onMouseMove={() => { if (i !== active) setActive(i) }} onClick={() => pick(o)}
                  className={cn('relative flex min-h-11 cursor-pointer items-center gap-pw-3 px-pw-3 text-ink', i === active && 'bg-hover')}
                >
                  {i === active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-steel" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm"><Highlight label={o.name} query={res.q} /></span>
                    {o.nationality && <span className="block truncate text-xs text-ink-3">{o.nationality}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div role="status" className="sr-only">{message}</div>
    </div>
  )
}
