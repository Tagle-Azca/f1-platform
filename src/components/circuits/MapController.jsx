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

export function MapController({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const lat = parseFloat(target.Location?.lat  || target.lat)
    const lng = parseFloat(target.Location?.long || target.long)
    if (!isNaN(lat) && !isNaN(lng)) map.flyTo([lat, lng], 6, { duration: 1.2 })
  }, [target, map])
  return null
}
