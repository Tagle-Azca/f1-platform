import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Network } from 'lucide-react'
import { graphApi } from '../../services/api'
import { buttonVariants } from '../ui/button-variants'
import { DriverLink, TeamLink, RetryButton } from './ProfileLinks'
import { buildConnections } from './connectionsModel'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion } from '../../styles/motion'
import { teamMark, ctorColor, CTOR_COLORS, BASE } from '../../styles/vizPalette'
import { cn } from '@/lib/utils'

// The canvas (and react-force-graph-2d with it) is only imported after the tap.
const loadCanvas = () => import('./ConnectionsCanvas')
const ConnectionsCanvas = lazy(loadCanvas)

const FRAME = 'relative h-80 overflow-hidden rounded-md border border-edge bg-panel md:h-[400px] xl:h-[480px]'

/** Catches a failed chunk or a canvas init error; static copy only. */
class CanvasBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false }) }
  render() {
    return this.state.failed ? <FrameMessage what="the network" onRetry={this.props.onRetry} /> : this.props.children
  }
}

function FrameMessage({ what, onRetry }) {
  return (
    <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-pw-2 px-pw-4 text-center">
      <p className="text-sm text-ink-2">We couldn&apos;t load {what}.</p>
      <RetryButton onClick={onRetry} />
    </div>
  )
}

function FrameSkeleton() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-center gap-pw-3 px-pw-6">
      {['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3'].map((w) => <div key={w} className={`viz-pulse h-4 rounded-[2px] bg-edge-soft ${w}`} />)}
    </div>
  )
}

function Swatch({ shape }) {
  return (
    <svg aria-hidden="true" focusable="false" width="14" height="14" className="shrink-0">
      {shape === 'team' && <rect x="2" y="2" width="10" height="10" rx="2" fill="var(--viz-series-2)" />}
      {shape === 'driver' && <circle cx="7" cy="7" r="5" fill="var(--viz-series-2)" />}
      {shape === 'self' && <><circle cx="7" cy="7" r="3.5" fill="var(--viz-series-1)" /><circle cx="7" cy="7" r="6" fill="none" stroke="var(--viz-series-1)" strokeWidth="1.5" /></>}
    </svg>
  )
}

const chip = 'rounded-pill border border-edge px-pw-3 text-sm no-underline'

/**
 * Connections: nothing loads until "Show network" is tapped (at every breakpoint) - no graph chunk and no ego request.
 * The frame has one fixed height (320/400/480) before and after, so nothing shifts. The visible "Connected" list is the
 * keyboard and screen-reader path and the cross-link set.
 * `autoShow` (the Rivalries Network view) skips the tap: the network loads as soon as the section mounts.
 * @param {'driver'|'constructor'} type
 */
export default function ConnectionsSection({ type, id, name, autoShow = false }) {
  const reduced = useReducedMotion()
  const coarse = useMediaQuery('(pointer: coarse)')
  const [shown, setShown] = useState(autoShow)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: '', status: 'idle', payload: null })
  const [exploring, setExploring] = useState(false)
  const listRef = useRef(null)
  const viaKeyboard = useRef(false)
  const key = `${type}|${id}|${attempt}`

  useEffect(() => { if (autoShow) loadCanvas() }, [autoShow])

  useEffect(() => {
    if (!shown) return undefined
    let alive = true
    const call = type === 'driver' ? graphApi.getDriverEgoGraph : graphApi.getConstructorEgoGraph
    Promise.resolve().then(() => call(id)).then(
      (payload) => { if (alive) setState({ key, status: 'ready', payload }) },
      () => { if (alive) setState({ key, status: 'error', payload: null }) },
    )
    return () => { alive = false }
  }, [shown, type, id, key])

  const status = !shown ? 'idle' : state.key === key ? state.status : 'loading'
  const graph = useMemo(() => (status === 'ready' ? buildConnections(state.payload, { selfId: id }) : null), [status, state.payload, id])

  // Keyboard activation: move to the visible list (the accessible path) once it exists
  useEffect(() => {
    if (status === 'ready' && viaKeyboard.current) { viaKeyboard.current = false; listRef.current?.focus() }
  }, [status])

  const show = useCallback((e) => {
    viaKeyboard.current = e.detail === 0
    loadCanvas() // start the chunk in parallel with the data
    setShown(true)
  }, [])
  const retry = useCallback(() => { setState({ key: '', status: 'idle', payload: null }); setAttempt((n) => n + 1) }, [])

  const empty = graph?.empty
  const caption = `${type === 'driver' ? 'Teammates and teams linked to' : 'Drivers linked to'} ${name} in 2022–2026.`

  return (
    <section className="section" aria-labelledby={`cx-${type}`} data-connections>
      <h2 id={`cx-${type}`} className="text-heading text-ink">Connections</h2>
      <p className="mt-pw-1 text-xs text-ink-3">{caption}</p>

      <div className={cn(FRAME, 'mt-pw-4', exploring && 'outline outline-2 -outline-offset-2 outline-steel')} aria-busy={status === 'loading' || undefined}>
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-pw-3 px-pw-4 text-center">
            <Network aria-hidden="true" size={20} className="text-ink-3" />
            <p className="max-w-xs text-sm text-ink-2">
              {type === 'driver' ? `See who ${name} shares a team or garage with.` : `See the drivers who have raced for ${name}.`}
            </p>
            <button type="button" onClick={show} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Show network</button>
          </div>
        )}
        {status === 'loading' && <><FrameSkeleton /><span role="status" className="sr-only">Loading network</span></>}
        {status === 'error' && <FrameMessage what="the network" onRetry={retry} />}
        {status === 'ready' && empty && (
          <p className="absolute inset-0 flex items-center justify-center px-pw-4 text-center text-sm text-ink-2">No connections found in the 2022–2026 data.</p>
        )}
        {status === 'ready' && !empty && (
          <>
            <div role="img" aria-label={`Network graph of ${name}'s connections. The list below has the same people and teams.`} className="absolute inset-0">
              <CanvasBoundary onRetry={retry} resetKey={attempt}>
                <Suspense fallback={<FrameSkeleton />}>
                  <ConnectionsCanvas graph={graph} exploring={exploring} reduced={reduced} coarse={coarse} />
                </Suspense>
              </CanvasBoundary>
            </div>
            <button
              type="button" aria-pressed={exploring} onClick={() => setExploring((v) => !v)}
              className={cn(buttonVariants({ variant: 'secondary' }), 'absolute bottom-pw-3 left-pw-3 min-h-11 bg-panel/90')}
            >
              {exploring ? 'Lock network' : 'Explore network'}
            </button>
          </>
        )}
      </div>

      {status === 'ready' && !empty && (
        <>
          <ul className="mt-pw-3 flex flex-wrap items-center gap-x-pw-5 gap-y-pw-2 text-xs text-ink-2" aria-label="Legend">
            <li className="flex items-center gap-pw-2"><Swatch shape="driver" />Driver</li>
            <li className="flex items-center gap-pw-2"><Swatch shape="team" />Team</li>
            <li className="flex items-center gap-pw-2"><Swatch shape="self" />{name}</li>
          </ul>
          <div ref={listRef} tabIndex={-1} className="mt-pw-4 outline-none" aria-labelledby={`cx-list-${type}`}>
            <p id={`cx-list-${type}`} className="text-xs text-ink-3">Connected</p>
            <ul className="mt-pw-2 flex flex-wrap gap-pw-2">
              {graph.connected.map((c) => (
                <li key={`${c.kind}-${c.id}`}>
                  {c.kind === 'team'
                    ? <TeamLink id={c.id} className={chip}><TeamDot slug={c.id} />{c.name}</TeamLink>
                    : <DriverLink id={c.id} className={chip}>{c.name}</DriverLink>}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}

function TeamDot({ slug }) {
  const color = teamMark(ctorColor(Object.hasOwn(CTOR_COLORS, slug) ? slug : ''), BASE.panel)
  return <svg aria-hidden="true" focusable="false" width="8" height="8" className="mr-pw-2 shrink-0"><rect width="8" height="8" rx="2" fill={color} /></svg>
}
