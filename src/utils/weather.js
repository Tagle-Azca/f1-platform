/** WMO weather code -> short text (Open-Meteo `weathercode`). */
export function weatherText(code) {
  if (typeof code !== 'number') return ''
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  return 'Storm'
}

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** "22° / 14°, 20% rain" for one forecast day, or '' when the day has no usable values. */
export function formatDayWeather(w) {
  if (!w || typeof w !== 'object') return ''
  const hi = fin(w.tempMax), lo = fin(w.tempMin), rain = fin(w.precipProb)
  const parts = []
  if (hi !== null && lo !== null) parts.push(`${hi}° / ${lo}°`)
  else if (hi !== null) parts.push(`${hi}°`)
  if (rain !== null && rain > 0) parts.push(`${rain}% rain`)
  return parts.join(', ')
}
