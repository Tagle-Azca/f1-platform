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

export function countryFlag(country) {
  const code = COUNTRY_ISO[country]
  if (!code) return null
  return `https://flagcdn.com/w40/${code}.png`
}
