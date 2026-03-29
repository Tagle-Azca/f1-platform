export const DRIVER_PALETTE = [
  '#e8002d','#27F4D2','#FF8000','#3671C6','#229971',
  '#FF87BC','#6692FF','#52E252','#f59e0b','#a855f7',
  '#06b6d4','#84cc16','#f97316','#ec4899','#14b8a6',
  '#8b5cf6','#ef4444','#10b981','#3b82f6','#fbbf24',
  '#6366f1','#d946ef',
]

export const COMPOUND_COLOR = {
  SOFT:         { bg: '#e8002d', label: '#fff' },
  MEDIUM:       { bg: '#ffd600', label: '#111' },
  HARD:         { bg: '#e0e0e0', label: '#111' },
  INTERMEDIATE: { bg: '#39b54a', label: '#fff' },
  WET:          { bg: '#0067ff', label: '#fff' },
  UNKNOWN:      { bg: 'repeating-linear-gradient(45deg,#444 0px,#444 4px,#2a2a2a 4px,#2a2a2a 8px)', label: 'rgba(255,255,255,0.55)' },
}

export const COMPOUND_ABBR = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W', UNKNOWN:'?' }

export function compound(raw = '') {
  const k = raw.toUpperCase()
  return COMPOUND_COLOR[k] ? k : 'UNKNOWN'
}

export function normalizeName(name = '') {
  return name.toLowerCase().replace(/grand prix/gi,'').replace(/[^a-z0-9]/g,'').trim()
}

export function formatTime(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

export function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a,b)=>a-b), m = Math.floor(s.length/2)
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2
}

export function stdDev(arr) {
  if (arr.length<2) return 0
  const avg=arr.reduce((a,b)=>a+b,0)/arr.length
  return Math.sqrt(arr.reduce((s,v)=>s+(v-avg)**2,0)/arr.length)
}
