import Panel from '../ui/Panel'

const PALETTE = [
  '#e8002d', '#27F4D2', '#FF8000', '#3671C6',
  '#229971', '#FF87BC', '#6692FF', '#52E252',
]

export default function PaceDriverSelector({ allDrivers, selectedDrivers, onToggle }) {
  return (
    <Panel padding="sm" className="card" style={{ marginBottom: '0.75rem' }}>
      <div className="table-header" style={{ marginBottom: '0.5rem' }}>SELECT DRIVERS · max 5</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {allDrivers.map((d) => {
          const isSelected = selectedDrivers.includes(d.driverId)
          const color = isSelected ? PALETTE[selectedDrivers.indexOf(d.driverId) % PALETTE.length] : undefined
          return (
            <button
              key={d.driverId}
              onClick={() => onToggle(d.driverId)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: 99, cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
                background: isSelected ? `${color}22` : 'transparent',
                color: isSelected ? color : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {d.acronym}
              <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', opacity: 0.6 }}>{d.teamName?.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
