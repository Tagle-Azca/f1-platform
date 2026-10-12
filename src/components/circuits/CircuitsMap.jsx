import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { motion } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import Flag from '../ui/Flag'
import TypeChip from './TypeChip'
import CircuitArt from './CircuitArt'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { makePin, makeClusterIcon, groupByPixels, clusterLabel, pinSize, syncPinState, graticuleLines, useMapCamera } from './circuitsMapParts'
import { specsLine, placeLine, circuitTitle } from './circuitFormat'
import { CARTO_DARK_TILES, HAS_CARTO_KEY } from '../../utils/mapTiles'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useReducedMotion, DUR, EASE_OUT } from '../../styles/motion'

const FRAME = 'h-[min(64svh,560px)] lg:h-[clamp(480px,calc(100svh-288px),680px)]'
const BOUNDS = [[-85, -200], [85, 200]]
const GRATICULE = graticuleLines()
const iconCache = new WeakMap()
const iconFor = (c) => { let i = iconCache.get(c); if (!i) { i = makePin(c); iconCache.set(c, i) } return i }

/** Lives inside MapContainer: camera, container label, drag lock and tap-to-dismiss. */
function MapEffects({ circuits, selected, idsKey, animate, pinRatio, dragging, label, onDismiss }) {
  const map = useMap()
  useMapCamera(map, { circuits, selected, animate, pinRatio, idsKey })
  useEffect(() => { map.getContainer().setAttribute('aria-label', label) }, [map, label])
  useEffect(() => {
    if (dragging) map.dragging.enable()
    else map.dragging.disable()
  }, [map, dragging])
  useEffect(() => {
    if (!onDismiss) return undefined
    map.on('click', onDismiss)
    return () => { map.off('click', onDismiss) }
  }, [map, onDismiss])
  return null
}

function Attribution() {
  if (!HAS_CARTO_KEY) return <p className="text-xs text-ink-3">Basemap unavailable. Pins show circuit locations.</p>
  return (
    <p className="text-xs text-ink-3">
      Map &copy;{' '}
      <a className="text-steel" href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>{' '}
      &copy;{' '}
      <a className="text-steel" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>{' '}
      contributors
    </p>
  )
}

function Rail({ circuits, selectedId, hoverId, onSelect, onHover }) {
  return (
    <section
      id="circuits-rail" tabIndex={-1} aria-label="Circuits on the map"
      className={`hidden w-[280px] shrink-0 flex-col overflow-hidden rounded-md border border-edge bg-panel outline-none lg:flex xl:w-[304px] ${FRAME}`}
    >
      <p className="num border-b border-edge-soft px-pw-4 py-pw-3 text-xs text-ink-3">{circuits.length} {circuits.length === 1 ? 'circuit' : 'circuits'}</p>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {circuits.map((c) => {
          const selected = c.id === selectedId
          const second = c.calendarOnly && c.calendarRound != null ? `Round ${c.calendarRound}` : placeLine(c)
          return (
            <li
              key={c.id} id={`cr-${c.id}`} data-type={c.type}
              className={cn('relative grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-edge-soft', selected ? 'bg-steel-soft' : hoverId === c.id ? 'bg-hover' : '')}
              onMouseEnter={() => onHover(c.id)} onMouseLeave={() => onHover(null)}
            >
              {selected && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-steel" />}
              <button
                type="button" aria-current={selected ? 'true' : undefined} onClick={() => onSelect(c.id, true)}
                onFocus={() => onHover(c.id)} onBlur={() => onHover(null)}
                className="flex min-h-12 min-w-0 cursor-pointer items-center gap-pw-3 border-0 bg-transparent px-pw-4 py-pw-2 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-steel active:translate-y-px"
              >
                <span aria-hidden="true" className="type-dot" />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{circuitTitle(c)}</span>
                  <span className="block truncate text-xs text-ink-3">{second}</span>
                </span>
              </button>
              <Link
                to={`/circuits/${c.id}`} aria-label={`Open ${circuitTitle(c)}`}
                className="flex size-11 items-center justify-center text-ink-3 outline-none hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-steel"
              >
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function SelectedCard({ circuit, headingRef, onClose, reduced }) {
  const motionProps = reduced ? { initial: false } : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: DUR.base, ease: EASE_OUT } }
  return (
    <motion.div
      role="region" aria-label="Selected circuit" data-type={circuit.type}
      className="absolute inset-x-pw-2 bottom-pw-2 z-[1000] rounded-md border border-edge bg-panel p-pw-3"
      {...motionProps}
    >
      <button
        type="button" aria-label="Close" onClick={onClose}
        className="absolute right-0 top-0 flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent text-ink-2 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-steel"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <div className="flex gap-pw-3 pr-pw-6">
        <div className="h-12 w-[72px] shrink-0 overflow-hidden rounded-md border border-edge-soft bg-bg p-pw-1 text-ink-2">
          <CircuitArt circuit={circuit} size="mini" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 ref={headingRef} tabIndex={-1} className="truncate font-display text-[15px] font-semibold leading-5 text-ink outline-none">{circuitTitle(circuit)}</h3>
          <p className="flex min-w-0 items-center gap-pw-2 text-xs text-ink-3"><Flag country={circuit.country} /><span className="truncate">{placeLine(circuit)}</span></p>
          <div className="mt-pw-1 flex flex-wrap items-center gap-x-pw-3"><TypeChip type={circuit.type} />{circuit.calendarRound != null && <span className="num text-xs text-ink-2">Round {circuit.calendarRound}</span>}</div>
        </div>
      </div>
      <p className="num mt-pw-2 text-ink-2 [overflow-wrap:anywhere]">{specsLine(circuit)}</p>
      <Link to={`/circuits/${circuit.id}`} className={cn(buttonVariants({ variant: 'outline' }), 'mt-pw-2 min-h-11 w-full')}>Open circuit</Link>
    </motion.div>
  )
}

/**
 * Circuit pins with overlap grouping: recomputed on every zoom/move end, so a cluster splits as you zoom in.
 * Enter and Space select a pin (Leaflet only maps Enter to click when a popup is bound).
 */
function PinLayer({ circuits, selectedId, animate, markers, onSelect, onHover }) {
  const map = useMap()
  const [view, setView] = useState(0)
  useMapEvents({ zoomend: () => setView((v) => v + 1), moveend: () => setView((v) => v + 1) })
  const groups = useMemo(
    () => groupByPixels(circuits, (ll) => map.latLngToLayerPoint(ll), pinSize(), selectedId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `view` re-runs the projection after zoom/move
    [circuits, selectedId, map, view],
  )
  const keyHandler = (fn) => (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn() } }
  const zoomInto = (members) => {
    const bounds = L.latLngBounds(members.map((c) => [c.lat, c.lng]))
    map.flyToBounds(bounds, { padding: [56, 56], maxZoom: Math.max(map.getZoom() + 2, 6), animate, duration: 0.6 })
  }

  return groups.map((g) => {
    if (g.members.length > 1) {
      const key = `cl-${g.members.map((c) => c.id).join('-')}`
      return (
        <Marker
          key={key} position={[g.members[0].lat, g.members[0].lng]} icon={makeClusterIcon(g.members.length)} keyboard
          eventHandlers={{
            click: () => zoomInto(g.members),
            add: (e) => {
              const el = e.target.getElement()
              if (!el) return
              el.setAttribute('aria-label', clusterLabel(g.members))
              el.onkeydown = keyHandler(() => zoomInto(g.members))
            },
          }}
        />
      )
    }
    const c = g.members[0]
    return (
      <Marker
        key={c.id} position={[c.lat, c.lng]} icon={iconFor(c)} title={circuitTitle(c)} keyboard
        ref={(m) => { if (m) markers.current.set(c.id, m); else markers.current.delete(c.id) }}
        eventHandlers={{
          click: () => onSelect(c.id, false),
          mouseover: () => onHover(c.id),
          mouseout: () => onHover(null),
          add: (e) => {
            syncPinState(e.target, c, { selected: c.id === selectedId, hover: false })
            const el = e.target.getElement()
            if (el) el.onkeydown = keyHandler(() => onSelect(c.id, true))
          },
        }}
      />
    )
  })
}

/**
 * Lazy map view. Leaflet, react-leaflet and leaflet.css load only with this module.
 * Selection lives in the URL (`selectedId`); at lg and up the synced rail is the list, below lg a bottom card shows the selection.
 */
export default function CircuitsMap({ circuits, total, selectedId, onSelect, onGrid, region }) {
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const coarse = useMediaQuery('(pointer: coarse)')
  const [hoverId, setHoverId] = useState(null)
  const [locked, setLocked] = useState(true)
  const [message, setMessage] = useState('')
  const markers = useRef(new Map())
  const headingRef = useRef(null)
  const focusCard = useRef(false)

  const selected = useMemo(() => circuits.find((c) => c.id === selectedId) ?? null, [circuits, selectedId])
  const idsKey = useMemo(() => `${region}|${circuits.map((c) => c.id).join(',')}`, [circuits, region])
  const exploreMode = !desktop && coarse
  const showCard = !desktop && selected !== null

  const select = useCallback((id, viaKeyboard = false) => {
    const c = circuits.find((x) => x.id === id)
    if (!c) return
    focusCard.current = viaKeyboard
    onSelect(id)
    setMessage(`${circuitTitle(c)} selected.`)
  }, [circuits, onSelect])

  const close = useCallback(() => {
    const id = selectedId
    onSelect('')
    if (id) markers.current.get(id)?.getElement?.()?.focus()
  }, [onSelect, selectedId])
  const dismiss = useCallback(() => onSelect(''), [onSelect])

  // Keyboard selection below lg moves focus to the card heading
  useEffect(() => {
    if (!showCard || !focusCard.current) return
    focusCard.current = false
    headingRef.current?.focus()
  }, [showCard, selectedId])

  // Selected / hover state on the live pins; the selected rail row scrolls into view
  useEffect(() => {
    for (const c of circuits) syncPinState(markers.current.get(c.id), c, { selected: c.id === selectedId, hover: c.id === hoverId })
  }, [circuits, selectedId, hoverId])
  useEffect(() => {
    if (desktop && selectedId) document.getElementById(`cr-${selectedId}`)?.scrollIntoView?.({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  }, [desktop, selectedId, reduced])

  const label = desktop
    ? 'Circuits map. The list beside it, or the Grid view, lists every circuit.'
    : 'Circuits map. The Grid view lists every circuit.'
  const dragging = !exploreMode || !locked
  const toggleLock = () => { setLocked((v) => !v); setMessage(locked ? 'Map unlocked.' : 'Map locked.') }

  return (
    <div>
      <a
        href={desktop ? '#circuits-rail' : '#circuits-view-grid'}
        className="sr-only focus:not-sr-only focus:mb-pw-2 focus:inline-flex focus:min-h-11 focus:items-center focus:text-sm focus:font-semibold focus:text-steel"
        onClick={(e) => { e.preventDefault(); document.getElementById(desktop ? 'circuits-rail' : 'circuits-view-grid')?.focus() }}
      >
        Skip map
      </a>
      <div className="flex gap-pw-4">
        <div
          data-circuits-map
          className={cn('relative isolate min-w-0 flex-1 overflow-hidden rounded-md border border-edge bg-bg', FRAME, exploreMode && !locked && 'ring-2 ring-inset ring-steel')}
          onKeyDown={(e) => { if (e.key === 'Escape' && showCard) { e.preventDefault(); close() } }}
        >
          <MapContainer
            center={[25, 15]} zoom={2} minZoom={1} maxZoom={12} zoomSnap={0.25} className="size-full"
            zoomControl={false} attributionControl={false} scrollWheelZoom={false}
            maxBounds={BOUNDS} maxBoundsViscosity={1} worldCopyJump
          >
            {HAS_CARTO_KEY
              ? <TileLayer url={CARTO_DARK_TILES} />
              : GRATICULE.map((pos, i) => <Polyline key={i} positions={pos} interactive={false} pathOptions={{ weight: 1, className: 'cmap-grat' }} />)}
            <ZoomControl key={desktop ? 'br' : 'tr'} position={desktop ? 'bottomright' : 'topright'} />
            <MapEffects
              circuits={circuits} selected={selected} idsKey={idsKey} animate={!reduced} pinRatio={desktop ? null : 0.35}
              dragging={dragging} label={label} onDismiss={desktop ? null : dismiss}
            />
            <PinLayer circuits={circuits} selectedId={selectedId} animate={!reduced} markers={markers} onSelect={select} onHover={setHoverId} />
          </MapContainer>

          {exploreMode && !showCard && (
            <button
              type="button" aria-pressed={!locked} onClick={toggleLock}
              className="absolute bottom-pw-2 left-pw-2 z-[1000] min-h-11 cursor-pointer rounded-md border border-edge bg-panel px-pw-4 text-sm font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel"
            >
              {locked ? 'Explore map' : 'Lock map'}
            </button>
          )}
          {showCard && <SelectedCard circuit={selected} headingRef={headingRef} onClose={close} reduced={reduced} />}
        </div>
        <Rail circuits={circuits} selectedId={selectedId} hoverId={hoverId} onSelect={select} onHover={setHoverId} />
      </div>

      <div className="mt-pw-2 flex flex-col gap-pw-1">
        <Attribution />
        {!desktop && (
          <p className="flex flex-wrap items-center gap-x-pw-3 text-sm text-ink-2">
            <span className="num">Showing {circuits.length} of {total} circuits.</span>
            <button id="circuits-view-grid" type="button" tabIndex={-1} onClick={onGrid} className="min-h-11 cursor-pointer border-0 bg-transparent px-pw-1 font-semibold text-steel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel">
              View as grid
            </button>
          </p>
        )}
      </div>
      <div role="status" aria-live="polite" className="sr-only">{message}</div>
    </div>
  )
}
