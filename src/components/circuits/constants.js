import { canonicalCircuitId } from '../../utils/circuitSpecs'

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

/** Display order of the regions in the filter. */
export const REGION_ORDER = ['Europe', 'Americas', 'Asia', 'Middle East', 'Oceania', 'Africa', 'Other']

/** Region of a country; own-property lookup, so feed strings like "__proto__" fall to 'Other'. */
export function regionOf(country) {
  return typeof country === 'string' && Object.hasOwn(CONTINENT, country) ? CONTINENT[country] : 'Other'
}

export const CIRCUIT_TYPES = {
  monaco: 'street', baku: 'street', marina_bay: 'street', jeddah: 'street', las_vegas: 'street',
  albert_park: 'hybrid', miami: 'hybrid', villeneuve: 'hybrid', sochi: 'hybrid', madring: 'hybrid',
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

/** Circuit class ('permanent' | 'street' | 'hybrid'); unknown ids default to permanent. */
export function circuitType(circuitId) {
  const id = canonicalCircuitId(circuitId)
  return Object.hasOwn(CIRCUIT_TYPES, id) ? CIRCUIT_TYPES[id] : 'permanent'
}

export const TYPE_LABELS = { permanent: 'Permanent', street: 'Street', hybrid: 'Hybrid' }

