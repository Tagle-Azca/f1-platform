// CARTO dark basemap tiles. CARTO requires an API key (passed as ?key=); it comes from
// VITE_CARTO_KEY (.env.local locally, project env vars on Vercel). Without one, CARTO serves
// "API KEY REQUIRED" placeholder tiles.
const KEY = import.meta.env.VITE_CARTO_KEY

export const CARTO_DARK_TILES =
  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${KEY ? `?key=${encodeURIComponent(KEY)}` : ''}`

export const CARTO_ATTRIBUTION = '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** True when a CARTO key is configured; without one the Circuits map draws a plain canvas instead of tiles. */
export const HAS_CARTO_KEY = Boolean(KEY)
