const COUNTRY_CODES = {
  'Australia': 'au', 'Bahrain': 'bh', 'Saudi Arabia': 'sa', 'Japan': 'jp',
  'China': 'cn', 'USA': 'us', 'United States': 'us', 'Italy': 'it',
  'Monaco': 'mc', 'Canada': 'ca', 'Spain': 'es', 'Austria': 'at',
  'UK': 'gb', 'United Kingdom': 'gb', 'Hungary': 'hu', 'Belgium': 'be',
  'Netherlands': 'nl', 'Singapore': 'sg', 'Mexico': 'mx', 'Brazil': 'br',
  'Las Vegas': 'us', 'Qatar': 'qa', 'UAE': 'ae', 'Abu Dhabi': 'ae',
  'Azerbaijan': 'az', 'France': 'fr', 'Germany': 'de', 'Portugal': 'pt',
  'Turkey': 'tr', 'Russia': 'ru', 'Miami': 'us',
}

export default function Flag({ country }) {
  if (!country) return null
  const code = COUNTRY_CODES[country] || country?.slice(0, 2).toLowerCase()
  return (
    <img
      src={`https://flagcdn.com/24x18/${code}.png`}
      alt={country}
      style={{ width: 20, height: 15, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}
