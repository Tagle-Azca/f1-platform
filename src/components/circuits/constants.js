export const CONTINENT = {
  'Australia': 'Oceania', 'New Zealand': 'Oceania',
  'USA': 'Americas', 'United States': 'Americas', 'Mexico': 'Americas',
  'Brazil': 'Americas', 'Argentina': 'Americas', 'Canada': 'Americas',
  'Venezuela': 'Americas',
  'UK': 'Europe', 'United Kingdom': 'Europe', 'Germany': 'Europe',
  'Italy': 'Europe', 'France': 'Europe', 'Spain': 'Europe',
  'Monaco': 'Europe', 'Belgium': 'Europe', 'Netherlands': 'Europe',
  'Austria': 'Europe', 'Portugal': 'Europe', 'Hungary': 'Europe',
  'Switzerland': 'Europe', 'Sweden': 'Europe', 'San Marino': 'Europe',
  'Turkey': 'Europe', 'Russia': 'Europe',
  'Japan': 'Asia', 'China': 'Asia', 'South Korea': 'Asia',
  'Singapore': 'Asia', 'India': 'Asia', 'Vietnam': 'Asia', 'Malaysia': 'Asia',
  'Thailand': 'Asia', 'Azerbaijan': 'Asia',
  'Bahrain': 'Middle East', 'UAE': 'Middle East', 'Saudi Arabia': 'Middle East',
  'Qatar': 'Middle East', 'Abu Dhabi': 'Middle East',
  'South Africa': 'Africa', 'Morocco': 'Africa',
}

export function continent(country) { return CONTINENT[country] || 'Other' }

export const CONTINENT_FILTERS = ['All', 'Europe', 'Americas', 'Asia', 'Middle East', 'Oceania', 'Africa']

export const CIRCUIT_TYPES = {
  monaco: 'street', baku: 'street', marina_bay: 'street', jeddah: 'street', las_vegas: 'street',
  albert_park: 'hybrid', miami: 'hybrid', villeneuve: 'hybrid', sochi: 'hybrid',
  silverstone: 'permanent', monza: 'permanent', spa: 'permanent', suzuka: 'permanent',
  interlagos: 'permanent', hungaroring: 'permanent', catalunya: 'permanent',
  red_bull_ring: 'permanent', zandvoort: 'permanent', bahrain: 'permanent',
  yas_marina: 'permanent', americas: 'permanent', rodriguez: 'permanent',
  losail: 'permanent', imola: 'permanent', portimao: 'permanent', mugello: 'permanent',
  nurburgring: 'permanent', hockenheimring: 'permanent', sepang: 'permanent',
  shanghai: 'permanent', istanbul: 'permanent', ricard: 'permanent',
  kyalami: 'permanent', brands_hatch: 'permanent', watkins_glen: 'permanent',
  jacarepagua: 'permanent',
}

export function circuitType(circuitId) {
  return CIRCUIT_TYPES[circuitId] || 'permanent'
}

export const TYPE_FILTERS = ['All', 'Street', 'Permanent', 'Hybrid']

export const TYPE_COLORS = { street: '#f59e0b', hybrid: '#6366f1', permanent: '#22c55e' }
