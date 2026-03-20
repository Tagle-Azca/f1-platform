export default function StandingsHeader({ season, onSeasonChange, seasons, tab, onTabChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
      <div>
        <h1 className="page__title" style={{ marginBottom: 0 }}>Championship Battle</h1>
        <p className="page__subtitle" style={{ marginBottom: 0 }}>Points evolution round by round</p>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {[['wdc', 'WDC'], ['wcc', 'WCC']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              padding: '0.3rem 0.85rem', borderRadius: 6,
              border: `1px solid ${tab === key ? 'rgba(225,6,0,0.8)' : 'rgba(255,255,255,0.1)'}`,
              background: tab === key ? 'rgba(255, 10, 2, 0.7)' : 'transparent',
              color: tab === key ? '#FFFDFD' : 'rgba(255,255,255,0.4)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
        <select
          className="input"
          style={{ width: 115 }}
          value={season}
          onChange={e => onSeasonChange(e.target.value)}
        >
          {seasons.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
}
