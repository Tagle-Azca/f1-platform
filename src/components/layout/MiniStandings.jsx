import { useState } from 'react'
import { CTOR_COLORS } from '../../utils/teamColors'

function teamColor(constructorId) {
  return CTOR_COLORS[constructorId] || '#888'
}

export default function MiniStandings({ standings, constructorStandings, onSelect }) {
  const [tab, setTab] = useState('drivers')
  const list = tab === 'drivers' ? standings : constructorStandings
  if (!list?.length) return null

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.5rem' }}>
        {[['drivers', 'WDC'], ['constructors', 'WCC']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '0.3rem 0',
              borderRadius: 6,
              border: `1px solid ${tab === key ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: tab === key ? 'rgba(225,6,0,0.12)' : 'transparent',
              color: tab === key ? '#e10600' : 'rgba(255,255,255,0.38)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {list.map((entry, i) => {
          const color = teamColor(entry.constructorId)
          return (
            <div key={i}
              onClick={() => onSelect(entry, tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.4rem 0.75rem',
                borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: i === 0 ? 'rgba(225,6,0,0.04)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 ? 'rgba(225,6,0,0.04)' : 'transparent'}
            >
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.78rem', fontWeight: 700,
                color: i === 0 ? color : 'rgba(255,255,255,0.25)',
                width: 16, textAlign: 'right', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem', fontWeight: i === 0 ? 700 : 500,
                  color: i === 0 ? '#fff' : 'rgba(255,255,255,0.75)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {tab === 'drivers' ? entry.name.split(' ').slice(-1)[0] : entry.name}
                </div>
                {tab === 'drivers' && (
                  <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.team}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: i === 0 ? color : 'rgba(255,255,255,0.5)',
                fontVariantNumeric: 'tabular-nums', flexShrink: 0,
              }}>
                {entry.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
