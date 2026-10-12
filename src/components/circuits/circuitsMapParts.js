// Leaflet-only helpers for the Circuits map. Imported by CircuitsMap.jsx only, so Leaflet stays in its lazy chunk.
import { useEffect, useRef } from 'react'
import L from 'leaflet'

/** Pin box in px: a 44px hit area on a coarse pointer, 32px otherwise. */
export const pinSize = () => (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 44 : 32)

/** divIcon for one circuit. Selection and hover are classes toggled on the live element (see syncPinState), never a new icon, so focus survives. */
export function makePin(circuit) {
  const size = pinSize()
  return L.divIcon({
    className: 'cmark-wrap',
    html: `<span class="cmark ${circuit.calendarOnly ? 'cmark--cal' : ''}" data-type="${circuit.type}"><span class="cmark__dot"></span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Count bubble for pins that would overlap at the current zoom. Same hit area as a pin. */
export function makeClusterIcon(count) {
  const size = pinSize()
  return L.divIcon({
    className: 'cmark-wrap cmark-wrap--cluster',
    html: `<span class="cmark cmark--cluster"><span class="cmark__count num">${Number(count) || 0}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/**
 * Greedy pixel clustering at one zoom level: a circuit joins the first group whose anchor is closer
 * than `radius` px, so no two hit areas overlap. `keepId` (the selection) is never grouped.
 * Pure: `project` maps [lat, lng] to a {x, y} pixel point.
 */
export function groupByPixels(circuits, project, radius, keepId) {
  const groups = []
  for (const c of circuits) {
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) continue
    const p = project([c.lat, c.lng])
    if (c.id === keepId) { groups.push({ anchor: p, members: [c], keep: true }); continue }
    const near = groups.find((g) => !g.keep && Math.hypot(g.anchor.x - p.x, g.anchor.y - p.y) < radius)
    if (near) near.members.push(c)
    else groups.push({ anchor: p, members: [c], keep: false })
  }
  return groups
}

/** Accessible name of a cluster bubble. */
export const clusterLabel = (members) =>
  `${members.length} circuits close together: ${members.map((c) => c.name || 'Unknown circuit').join(', ')}. Press to zoom in.`

/** Accessible name of a pin. */
export const pinLabel = (circuit, selected) =>
  `${circuit.name || 'Unknown circuit'}, ${circuit.type}${circuit.calendarOnly ? ', not in race data' : ''}${selected ? ', selected' : ''}`

/** Applies selected / hover state to a marker's live DOM element. */
export function syncPinState(marker, circuit, { selected, hover }) {
  const el = marker?.getElement?.()
  if (!el) return
  el.classList.toggle('cmark-wrap--selected', selected)
  el.classList.toggle('cmark-wrap--hover', hover && !selected)
  el.setAttribute('aria-label', pinLabel(circuit, selected))
  el.setAttribute('data-type', circuit.type)
  if (selected) el.setAttribute('aria-current', 'true')
  else el.removeAttribute('aria-current')
  marker.setZIndexOffset(selected ? 1000 : hover ? 500 : 0)
}

/** Graticule drawn instead of tiles when no basemap is configured: one polyline per 30 degrees. */
export function graticuleLines() {
  const lines = []
  for (let lat = -60; lat <= 60; lat += 30) lines.push([[lat, -180], [lat, 180]])
  for (let lng = -180; lng <= 180; lng += 30) lines.push([[-85, lng], [85, lng]])
  return lines
}

const points = (circuits) => circuits.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)).map((c) => [c.lat, c.lng])

/** Position of a pin in the frame: the selected pin sits at `ratio` of the frame height (0.35 above the bottom card). */
export function panTarget(map, latlng, zoom, ratio) {
  if (ratio == null) return latlng
  const size = map.getSize()
  const pin = map.project(latlng, zoom)
  return map.unproject(pin.add([0, (0.5 - ratio) * size.y]), zoom)
}

/**
 * Camera for the Circuits map: fits the pins once, flies to the selection, flies to the pins when the set changes,
 * keeps the size valid, and gates wheel zoom behind a click or focus. `animate` is false under reduced motion.
 */
export function useMapCamera(map, { circuits, selected, animate, pinRatio, idsKey }) {
  const first = useRef(true)
  const lastSelected = useRef(null)
  const initialView = useRef(true) // the first framing never animates

  // Keep Leaflet's size in step with its container (view switch, resize, chunk arriving after layout)
  useEffect(() => {
    if (!map) return undefined
    const el = map.getContainer()
    const refresh = () => map.invalidateSize({ animate: false })
    const raf = requestAnimationFrame(refresh)
    const t = setTimeout(refresh, 250)
    let ro
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(refresh); ro.observe(el) }
    map.once('load', refresh)
    return () => { cancelAnimationFrame(raf); clearTimeout(t); ro?.disconnect() }
  }, [map])

  // Wheel zoom is off until the map is clicked or focused, off again on blur
  useEffect(() => {
    if (!map) return undefined
    const on = () => map.scrollWheelZoom.enable()
    const off = () => map.scrollWheelZoom.disable()
    map.scrollWheelZoom.disable()
    map.on('focus click', on)
    map.on('blur', off)
    return () => { map.off('focus click', on); map.off('blur', off) }
  }, [map])

  // The pins in view: fit on mount, fly when the filtered set changes
  useEffect(() => {
    if (!map) return
    const pts = points(circuits)
    if (!pts.length) return
    const isFirst = first.current
    first.current = false
    if (isFirst && selected) return // the selection effect frames the first view
    if (isFirst) initialView.current = false
    if (pts.length === 1) {
      if (isFirst) map.setView(pts[0], 6, { animate: false })
      else map.flyTo(pts[0], 6, { animate, duration: 0.8 })
      return
    }
    const bounds = L.latLngBounds(pts)
    if (isFirst) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6, animate: false })
    else map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 6, animate, duration: 0.8 })
  }, [map, idsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // The selection
  useEffect(() => {
    if (!map) return
    if (!selected) { lastSelected.current = null; return }
    if (lastSelected.current === selected.id) return
    lastSelected.current = selected.id
    const animateNow = animate && !initialView.current
    initialView.current = false
    if (!Number.isFinite(selected.lat) || !Number.isFinite(selected.lng)) return
    const zoom = Math.max(map.getZoom(), 7)
    const target = panTarget(map, L.latLng(selected.lat, selected.lng), zoom, pinRatio)
    map.flyTo(target, zoom, { animate: animateNow, duration: 0.9, easeLinearity: 0.25 })
  }, [map, selected, animate, pinRatio])
}
