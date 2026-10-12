import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Search, User, Users, X } from 'lucide-react'
import { searchApi } from '../../services/api'
import { groupSearchResults, flattenGroups, splitMatch } from './encyclopediaModel'
import { DUR, useReducedMotion } from '../../styles/motion'
import { cn } from '@/lib/utils'

export const SEARCH_DEBOUNCE_MS = 250
export const SEARCH_MIN_CHARS = 2
const ICONS = { driver: User, constructor: Users, circuit: MapPin, race: CalendarDays }
const isEditable = (el) => el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

function Highlight({ label, query }) {
  const [pre, hit, post] = splitMatch(label, query)
  return <>{pre}{hit && <span className="font-semibold">{hit}</span>}{post}</>
}

function SkeletonRows() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex min-h-12 items-center gap-pw-3 px-pw-3">
          <div className="viz-pulse size-4 rounded-[2px] bg-edge-soft" />
          <div className="flex flex-1 flex-col gap-pw-1"><div className="viz-pulse h-3.5 w-3/5 rounded-[2px] bg-edge-soft" /><div className="viz-pulse h-3 w-2/5 rounded-[2px] bg-edge-soft" /></div>
        </div>
      ))}
    </div>
  )
}

/**
 * Search combobox (WAI-ARIA): the input keeps focus while arrows move `aria-activedescendant` over the options.
 * Options are real links (`<a role="option">`), so middle-click and "open in a new tab" work; Enter clicks the active one.
 * 250ms debounce, 2+ characters, results grouped Drivers / Constructors / Circuits / Races. A newer query always wins
 * over a slower earlier one. `/` focuses the field (Encyclopedia hub only: this component is only mounted there).
 */
export default function EncyclopediaSearch({ id = 'enc-search' }) {
  const reduced = useReducedMotion()
  const location = useLocation()
  const listId = useId()
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const seq = useRef(0)
  const [query, setQuery] = useState('')
  const [openedAt, setOpenedAt] = useState(null) // the router location key the popup was opened on: a route change closes it
  const open = openedAt === location.key
  const setOpen = useCallback((v) => setOpenedAt(v ? location.key : null), [location.key])
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)
  const [attempt, setAttempt] = useState(0)
  const [res, setRes] = useState({ status: 'idle', groups: [], q: '' })
  const [message, setMessage] = useState('')

  const q = query.trim()
  const enabled = q.length >= SEARCH_MIN_CHARS

  useEffect(() => {
    if (!enabled) { seq.current += 1; return undefined } // an answer still on its way for the old text is dropped
    const mine = ++seq.current
    const t = setTimeout(() => {
      setRes((r) => ({ ...r, status: 'loading' }))
      Promise.resolve().then(() => searchApi.search(q, 20)).then(
        (rows) => {
          if (mine !== seq.current) return // a newer query already took over
          const groups = groupSearchResults(rows)
          setRes({ status: 'ready', groups, q })
          setActive(-1)
          const n = flattenGroups(groups).length
          setMessage(n ? `${n} ${n === 1 ? 'result' : 'results'}` : 'No results')
        },
        () => {
          if (mine !== seq.current) return
          setRes((r) => ({ status: 'error', groups: [], q: r.q }))
          setMessage('Search failed')
        },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [q, enabled, attempt])

  // "/" focuses the field unless the user is typing somewhere else
  useEffect(() => {
    function onKey(e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || isEditable(document.activeElement) || isEditable(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const flat = useMemo(() => flattenGroups(res.groups), [res.groups])
  const indexed = useMemo(() => {
    let n = 0
    return res.groups.map((g) => ({ ...g, items: g.items.map((it) => ({ ...it, i: n++ })) }))
  }, [res.groups])
  const results = enabled && res.status !== 'idle'
  const hasItems = results && flat.length > 0
  const expanded = open && hasItems
  const showPanel = open && enabled && (res.status === 'loading' || res.status === 'error' || hasItems || res.status === 'ready')
  const loadingFresh = res.status === 'loading' && flat.length === 0
  const optId = (i) => `${listId}-opt-${i}`
  const from = `${location.pathname}${location.search}`

  const move = useCallback((to) => {
    if (!flat.length) return
    setActive(((to % flat.length) + flat.length) % flat.length)
  }, [flat.length])

  function onKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) setOpen(true)
        move(active < 0 ? 0 : active + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) setOpen(true)
        move(active < 0 ? flat.length - 1 : active - 1)
        break
      case 'Home':
      case 'End':
        if (expanded && active >= 0) { e.preventDefault(); move(e.key === 'Home' ? 0 : flat.length - 1) }
        break
      case 'Enter':
        if (expanded && active >= 0) { e.preventDefault(); document.getElementById(optId(active))?.click() }
        break
      case 'Escape':
        if (open && showPanel) { e.preventDefault(); setOpen(false); setActive(-1) } else if (query) { e.preventDefault(); setQuery('') }
        break
      default:
    }
  }

  function onBlur(e) {
    if (wrapRef.current?.contains(e.relatedTarget)) return
    setFocused(false)
    setOpen(false)
  }

  const onChange = (e) => { setQuery(e.target.value.slice(0, 60)); setOpen(true); setActive(-1) }
  const clear = () => { setQuery(''); setActive(-1); setRes({ status: 'idle', groups: [], q: '' }); inputRef.current?.focus() }

  const popupMotion = reduced ? {} : { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, transition: { duration: DUR.fast } }

  return (
    <div ref={wrapRef} className="relative w-full xl:w-96" onBlur={onBlur}>
      <label htmlFor={id} className="mb-pw-1 block text-xs text-ink-2">Search</label>
      <div className="relative">
        <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-pw-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          ref={inputRef} id={id} type="text" role="combobox" autoComplete="off" spellCheck={false} maxLength={60}
          aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-autocomplete="list" aria-haspopup="listbox"
          aria-activedescendant={expanded && active >= 0 ? optId(active) : undefined} aria-keyshortcuts="/"
          placeholder="Driver, team or circuit" value={query}
          onChange={onChange} onKeyDown={onKeyDown} onFocus={() => { setFocused(true); if (enabled) setOpen(true) }}
          className="min-h-11 w-full rounded-md border border-edge bg-panel pl-9 pr-11 text-sm text-ink hover:border-ink-3 md:min-h-9"
        />
        {query ? (
          <button type="button" aria-label="Clear search" onClick={clear} className="absolute right-0 top-1/2 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent text-ink-3 hover:text-ink md:size-9">
            <X aria-hidden="true" size={16} />
          </button>
        ) : !focused && (
          <kbd aria-hidden="true" className="num pointer-events-none absolute right-pw-3 top-1/2 hidden size-5 -translate-y-1/2 items-center justify-center rounded border border-edge text-xs text-ink-3 md:[@media(hover:hover)_and_(pointer:fine)]:inline-flex">/</kbd>
        )}
      </div>

      {showPanel && (
        <motion.div
          {...popupMotion} aria-busy={res.status === 'loading' || undefined}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 top-full z-[60] mt-pw-2 max-h-[min(24rem,60svh)] w-full min-w-[min(20rem,100%)] overflow-y-auto overscroll-contain rounded-md border border-edge bg-panel shadow-float"
        >
          {loadingFresh && <SkeletonRows />}
          {res.status === 'error' && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-pw-2 px-pw-3 py-pw-3">
              <p className="text-sm text-ink-2">Search isn&apos;t available right now.</p>
              <button type="button" onClick={() => { setRes((r) => ({ ...r, status: 'loading' })); setAttempt((n) => n + 1) }} className="inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-sm font-semibold text-steel hover:text-steel-hi">Try again</button>
            </div>
          )}
          {res.status === 'ready' && !hasItems && (
            <div role="status" className="px-pw-3 py-pw-3">
              <p className="text-sm text-ink">No matches for &ldquo;{res.q}&rdquo;.</p>
              <p className="mt-pw-1 text-xs text-ink-3">Check the spelling, or browse the tabs below.</p>
            </div>
          )}
          {hasItems && (
            <ul id={listId} role="listbox" aria-label="Search results" className="py-pw-1">
              {indexed.map((g) => (
                <li key={g.key} role="presentation">
                  <p id={`${listId}-${g.key}`} role="presentation" className="px-pw-3 pb-pw-1 pt-pw-2 text-xs font-medium text-ink-3">{g.title}</p>
                  <ul role="group" aria-labelledby={`${listId}-${g.key}`}>
                    {g.items.map((item) => {
                      const i = item.i
                      const Icon = ICONS[item.type]
                      const on = i === active
                      return (
                        <li key={item.key} role="presentation">
                          <Link
                            id={optId(i)} role="option" aria-selected={on} to={item.href} tabIndex={-1}
                            state={item.type === 'race' ? undefined : { from }}
                            onMouseMove={() => { if (!on) setActive(i) }}
                            onClick={() => { setOpen(false); setActive(-1) }}
                            className={cn('relative flex min-h-12 items-center gap-pw-3 px-pw-3 text-ink no-underline', on && 'bg-hover')}
                          >
                            {on && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-steel" />}
                            <Icon aria-hidden="true" size={16} className="shrink-0 text-ink-3" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm"><Highlight label={item.label} query={res.q} /></span>
                              {item.meta && <span className="block truncate text-xs text-ink-3">{item.meta}</span>}
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
      <div role="status" className="sr-only">{message}</div>
    </div>
  )
}
