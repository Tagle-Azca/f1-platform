import { useId, useState } from 'react'
import { MapPin } from 'lucide-react'
import TrackTrace from '../viz/TrackTrace'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'

/**
 * Track map card. Nothing third-party loads until the user presses "Load map" (then one OpenStreetMap iframe,
 * same URL builder, sandbox and referrer policy as before). "Open in OpenStreetMap" is always available.
 */
export default function CircuitMapPanel({ lat, lng, coords, title = 'Track map', animate = true }) {
  const [loaded, setLoaded] = useState(false)
  const headingId = useId()
  const fLat = parseFloat(lat)
  const fLng = parseFloat(lng)
  if (!Number.isFinite(fLat) || !Number.isFinite(fLng)) return null

  // Only finite numbers reach the URL (no raw API strings).
  const bbox = [fLng - 0.012, fLat - 0.008, fLng + 0.012, fLat + 0.008].join(',')
  const osmUrl = `https://www.openstreetmap.org/?mlat=${fLat}&mlon=${fLng}#map=15/${fLat}/${fLng}`

  return (
    <section className="panel panel--md" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-heading text-ink">{title}</h2>
      <p className="num mt-pw-1 text-ink-3">{fLat.toFixed(4)}°, {fLng.toFixed(4)}°</p>
      <div className="mt-pw-3 h-[280px] overflow-hidden rounded-md border border-edge-soft lg:h-[360px]">
        {loaded ? (
          <iframe
            title={title}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${fLat},${fLng}`}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            loading="lazy"
            className="block size-full border-0"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-pw-3 bg-bg p-pw-4">
            <div aria-hidden="true" className="flex w-full max-w-60 items-center justify-center">
              <TrackTrace coords={coords} animate={animate} className="h-auto max-h-36 w-full opacity-60" />
              {!coords?.length && <MapPin className="size-8 text-ink-3" />}
            </div>
            <p className="text-center text-sm text-ink-2">The map loads from OpenStreetMap when you ask for it.</p>
            <button type="button" className={cn(buttonVariants({ size: 'lg' }))} onClick={() => setLoaded(true)}>Load map</button>
          </div>
        )}
      </div>
      <a
        href={osmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-pw-2 inline-flex min-h-11 items-center text-sm font-semibold text-steel no-underline hover:text-steel-hi"
      >
        Open in OpenStreetMap
      </a>
    </section>
  )
}
