import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export function makeIcon(selected) {
  const size = selected ? 28 : 20
  return L.divIcon({
    className: '',
    html: `<div class="f1-marker ${selected ? 'f1-marker--selected' : ''}">
             <div class="f1-marker__ring"></div>
             <div class="f1-marker__ring2"></div>
             <div class="f1-marker__dot"></div>
           </div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor:[0, -(size / 2)],
  })
}

const CONTINENT_VIEW = {
  'All':        { center: [25, 15],   zoom: 2 },
  'Europe':     { center: [50, 10],   zoom: 4 },
  'Americas':   { center: [5, -65],   zoom: 3 },
  'Asia':       { center: [35, 105],  zoom: 3 },
  'Middle East':{ center: [25, 50],   zoom: 5 },
  'Oceania':    { center: [-27, 135], zoom: 4 },
  'Africa':     { center: [0, 20],    zoom: 4 },
}

export function MapController({ target, contFilter }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    const lat = parseFloat(target.Location?.lat  || target.lat)
    const lng = parseFloat(target.Location?.long || target.long)
    if (!isNaN(lat) && !isNaN(lng)) map.flyTo([lat, lng], 6, { duration: 1.2 })
  }, [target, map])

  useEffect(() => {
    if (!contFilter || target) return
    const view = CONTINENT_VIEW[contFilter]
    if (view) map.flyTo(view.center, view.zoom, { duration: 1.2 })
  }, [contFilter, map])

  return null
}
