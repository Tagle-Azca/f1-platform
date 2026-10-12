import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import EmptyState from '../components/ui/EmptyState'
import CircuitSkeleton from '../components/circuits/CircuitSkeleton'
import CircuitsToolbar, { SearchBox, ViewControl } from '../components/circuits/CircuitsToolbar'
import FiltersSheet from '../components/circuits/FiltersSheet'
import CircuitsGrid from '../components/circuits/CircuitsGrid'
import {
  filterCircuits, sortCircuits, regionsPresent, parseIndexParams, toIndexParams,
  sheetFilterCount, hasActiveFilters, filterSummary, DEFAULT_STATE,
} from '../components/circuits/circuitIndexModel'
import { useCircuitsIndex } from '../hooks/useCircuitsIndex'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../styles/motion'

// Leaflet and its CSS live only in this chunk: the grid view never loads them (DoD-7).
const CircuitsMap = lazy(() => import('../components/circuits/CircuitsMap'))

const FILTER_KEYS = ['q', 'region', 'type', 'cal', 'sort']

/** Catches a failed map chunk or a Leaflet init error; static copy only. */
class MapBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <EmptyState
        type="error" height={200} message="The map could not be loaded"
        action={(
          <div className="flex flex-wrap justify-center gap-pw-3">
            <button type="button" className="btn btn--ghost btn--sentence min-h-11" onClick={this.props.onGrid}>Show grid</button>
            <button type="button" className="btn btn--primary btn--sentence min-h-11" onClick={() => this.setState({ failed: false })}>Try again</button>
          </div>
        )}
      />
    )
  }
}

export default function CircuitsPage() {
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 640px)')
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const idx = useCircuitsIndex()
  const { circuits, status, hasCalendar, season, nextId } = idx
  const ready = status === 'ready'
  const [entrance, setEntrance] = useState(() => idx.status === 'loading') // rise only when the list arrives from the network
  useEffect(() => {
    if (!ready) return undefined
    const t = setTimeout(() => setEntrance(false), 1500)
    return () => clearTimeout(t)
  }, [ready])
  // While loading, keep calendar keys in the URL untouched (the calendar is not known to have failed yet)
  const calOk = status !== 'ready' || hasCalendar
  const state = useMemo(() => parseIndexParams(params, { hasCalendar: calOk }), [params, calOk])

  useEffect(() => { document.title = 'Circuits · Pitwall' }, [])

  const update = useCallback((patch) => {
    setParams((prev) => {
      const cur = parseIndexParams(prev, { hasCalendar: calOk })
      const next = { ...cur, ...patch }
      if (FILTER_KEYS.some((k) => k in patch && k !== 'sort')) next.c = ''
      return toIndexParams(next, { hasCalendar: calOk })
    }, { replace: true })
  }, [setParams, calOk])

  const timer = useRef(null)
  const onSearch = useCallback((q) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => update({ q }), 200)
  }, [update])
  useEffect(() => () => clearTimeout(timer.current), [])

  const onClear = useCallback(() => update({ q: '', region: '', type: '', cal: false, sort: DEFAULT_STATE.sort, c: '' }), [update])

  const filtered = useMemo(() => sortCircuits(filterCircuits(circuits, state), state.sort), [circuits, state])
  const regions = useMemo(() => regionsPresent(circuits), [circuits])
  const total = circuits.length
  const active = hasActiveFilters(state)
  const selectedId = state.view === 'map' && filtered.some((c) => c.id === state.c) ? state.c : ''
  const onCalendar = useMemo(() => circuits.filter((c) => c.calendarRound != null).length, [circuits])
  const summary = filterSummary(state, season)

  const countText = !ready ? '' : active ? `${filtered.length} of ${total} circuits` : `${total} circuits`
  const subline = ready
    ? `${total} ${total === 1 ? 'circuit' : 'circuits'}.${hasCalendar ? ` ${onCalendar} on the ${season} calendar.` : ''}`
    : ''

  // Screen reader announcements: the settled result count and the view, never per keystroke
  const [message, setMessage] = useState('')
  const lastKey = useRef(null)
  const announceKey = `${state.view}|${filtered.length}`
  useEffect(() => {
    if (!ready) return undefined
    const prev = lastKey.current
    lastKey.current = announceKey
    if (prev === null || prev === announceKey) return undefined
    const t = setTimeout(() => {
      const viewChanged = prev.split('|')[0] !== state.view
      const count = filtered.length === 0 ? 'No circuits match.' : `${filtered.length} ${filtered.length === 1 ? 'circuit' : 'circuits'}.`
      setMessage(viewChanged ? `Showing ${state.view}. ${count}` : count)
    }, 400)
    return () => clearTimeout(t)
  }, [ready, announceKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const linkState = useMemo(() => ({ from: location.search }), [location.search])
  const onGrid = useCallback(() => update({ view: 'grid', c: '' }), [update])
  const onSelect = useCallback((id) => update({ c: id }), [update])

  const disabled = !ready
  const toolbarProps = { state, regions, hasCalendar: ready && hasCalendar, season, disabled, onChange: update, onSearch }

  let panel
  if (status === 'error') {
    panel = (
      <EmptyState
        type="error" height={200} message="Circuits could not be loaded"
        action={(
          <>
            <p className="text-sm text-ink-2">Check your connection and try again.</p>
            <button type="button" onClick={idx.retry} className="btn btn--primary btn--sentence min-h-11">Try again</button>
          </>
        )}
      />
    )
  } else if (!ready) {
    panel = state.view === 'map' ? <CircuitSkeleton variant="circuitmap" name="circuit map" />
      : <CircuitSkeleton variant={wide ? 'circuitcards' : 'circuitrows'} name="circuits" />
  } else if (total === 0) {
    panel = <EmptyState type="empty" height={160} message="No circuits available yet." />
  } else if (filtered.length === 0) {
    panel = (
      <EmptyState
        type="empty" height={200} message="No circuits match"
        action={(
          <>
            <p className="text-sm text-ink-3">{summary.length ? `${summary.join(', ')}. ` : ''}Try removing a filter.</p>
            <button type="button" onClick={onClear} className="btn btn--ghost btn--sentence min-h-11">Clear filters</button>
          </>
        )}
      />
    )
  } else if (state.view === 'map') {
    panel = (
      <MapBoundary onGrid={onGrid}>
        <Suspense fallback={<CircuitSkeleton variant="circuitmap" name="circuit map" />}>
          <CircuitsMap circuits={filtered} total={total} selectedId={selectedId} onSelect={onSelect} onGrid={onGrid} region={state.region} season={season} />
        </Suspense>
      </MapBoundary>
    )
  } else {
    panel = (
      <CircuitsGrid
        circuits={filtered} season={season} sort={state.sort} hasCalendar={hasCalendar} nextId={nextId}
        layout={wide ? 'portrait' : 'row'} entrance={entrance} linkState={linkState}
      />
    )
  }

  return (
    <PageWrapper stagger>
      <Rise index={0} as="header" className="mb-pw-5">
        <h1 className="text-title text-ink">Circuits</h1>
        <p className="mt-pw-1 min-h-5 text-sm text-ink-2">{subline}</p>
      </Rise>

      <Rise index={1} className="mb-pw-4">
        {wide ? (
          <CircuitsToolbar {...toolbarProps} />
        ) : (
          <div className="flex flex-col gap-pw-3">
            <SearchBox value={state.q} onChange={onSearch} />
            <div className="flex items-stretch gap-pw-3">
              <ViewControl value={state.view} onChange={(view) => update({ view })} className="min-w-0 flex-1" />
              <FiltersSheet
                state={state} regions={regions} hasCalendar={ready && hasCalendar} season={season} disabled={disabled}
                activeCount={sheetFilterCount(state)} count={filtered.length} canClear={active} onChange={update} onClear={onClear}
              />
            </div>
          </div>
        )}
      </Rise>

      {ready && !hasCalendar && (
        <p role="status" className="mb-pw-4 rounded-md border border-edge px-pw-4 py-pw-3 text-sm text-ink-2">
          The {season} calendar could not be loaded. Calendar order and the calendar filter are unavailable.
        </p>
      )}

      <Rise index={2}>
        <div className="mb-pw-4 flex flex-wrap items-center justify-between gap-x-pw-4">
          <div className="min-w-0">
            <p className="num min-h-5 text-ink-2">{countText}</p>
            {!wide && active && summary.length > 0 && <p className="text-xs text-ink-3 [overflow-wrap:anywhere]">{summary.join(', ')}</p>}
          </div>
          {active && (
            <button type="button" onClick={onClear} className="min-h-11 cursor-pointer border-0 bg-transparent px-pw-1 text-sm font-semibold text-steel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel">
              Clear filters
            </button>
          )}
        </div>

        <motion.div
          key={state.view}
          role="tabpanel" id="circuits-panel" aria-labelledby={`circuits-tab-${state.view}`} tabIndex={-1} aria-busy={status === 'loading' || undefined}
          className="outline-none"
          {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } })}
        >
          {panel}
        </motion.div>
      </Rise>

      <div role="status" aria-live="polite" className="sr-only">{message}</div>
    </PageWrapper>
  )
}
