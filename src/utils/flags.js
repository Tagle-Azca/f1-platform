const COUNTRY_ISO = {
  'Australia': 'au', 'China': 'cn', 'Japan': 'jp', 'Bahrain': 'bh',
  'Saudi Arabia': 'sa', 'USA': 'us', 'United States': 'us', 'Italy': 'it',
  'Monaco': 'mc', 'Canada': 'ca', 'Spain': 'es', 'Austria': 'at',
  'UK': 'gb', 'United Kingdom': 'gb', 'Great Britain': 'gb',
  'Hungary': 'hu', 'Belgium': 'be', 'Netherlands': 'nl',
  'Azerbaijan': 'az', 'Singapore': 'sg', 'Mexico': 'mx',
  'Brazil': 'br', 'Qatar': 'qa', 'UAE': 'ae', 'Abu Dhabi': 'ae',
  'United Arab Emirates': 'ae',
}

/** ISO-2 code (lower case) for a known country name; own-property lookup only. */
export function countryCode(country) {
  return typeof country === 'string' && Object.hasOwn(COUNTRY_ISO, country) ? COUNTRY_ISO[country] : null
}

export function countryFlag(country) {
  const code = countryCode(country)
  if (!code) return null
  return `https://flagcdn.com/w40/${code}.png`
}
