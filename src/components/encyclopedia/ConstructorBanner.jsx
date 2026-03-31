import { useState, useEffect, useRef } from 'react'
import { statsApi } from '../../services/api'
import { ctorColor } from '../../utils/teamColors'
import ConstructorLogo from '../ui/ConstructorLogo'

const WIKI_SLUGS = {
  ferrari:        'Scuderia_Ferrari',
  mclaren:        'McLaren',
  red_bull:       'Red_Bull_Racing',
  mercedes:       'Mercedes-AMG_Petronas_F1_Team',
  williams:       'Williams_Racing',
  alpine:         'Alpine_F1_Team',
  aston_martin:   'Aston_Martin_Aramco_F1_Team',
  haas:           'Haas_F1_Team',
  rb:             'Racing_Bulls',
  kick_sauber:    'Stake_F1_Team_Kick_Sauber',
  renault:        'Renault_in_Formula_One',
  force_india:    'Force_India',
  racing_point:   'Racing_Point_F1_Team',
  toro_rosso:     'Scuderia_Toro_Rosso',
  alfa:           'Alfa_Romeo_in_Formula_One',
  lotus_f1:       'Lotus_F1_Team',
  brawn:          'Brawn_GP',
  honda:          'Honda_in_Formula_One',
  toyota:         'Toyota_in_Formula_One',
  bmw_sauber:     'BMW_Sauber',
  bar:            'British_American_Racing',
  jaguar:         'Jaguar_Racing',
  minardi:        'Minardi',
  jordan:         'Jordan_Grand_Prix',
  tyrrell:        'Tyrrell_Racing',
  benetton:       'Benetton_Formula',
  brabham:        'Brabham',
  lotus:          'Team_Lotus',
  matra:          'Matra_(Formula_One)',
  stewart:        'Stewart_Grand_Prix',
  arrows:         'Arrows_Grand_Prix_International',
  ligier:         'Ligier',
  march:          'March_Engineering',
  wolf:           'Walter_Wolf_Racing',
  shadow:         'Shadow_Cars',
  sauber:         'Sauber_Motorsport',
}

function ConstructorCard({ ctor, onClick }) {
  const color = ctorColor(ctor.constructorId)

  return (
    <button
      onClick={() => onClick(ctor)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid var(--border)`,
        borderRadius: 12,
        padding: '0.75rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        width: 110,
        flexShrink: 0,
        transition: 'all 0.2s',
        textAlign: 'center',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.background  = `${color}12`
        e.currentTarget.style.transform   = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background  = 'var(--bg-surface)'
        e.currentTarget.style.transform   = 'none'
      }}
    >
      <ConstructorLogo
        constructorId={ctor.constructorId}
        name={ctor.name}
        color={color}
        size={72}
        radius={10}
      />

      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
        {ctor.name}
      </div>
      {ctor.finalPoints != null && (
        <div style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>
          {ctor.finalPoints} pts
        </div>
      )}
    </button>
  )
}

export default function ConstructorBanner({ season, onSelect }) {
  const [constructors, setConstructors] = useState([])
  const [loading, setLoading]           = useState(true)
  const scrollRef = useRef()

  useEffect(() => {
    setLoading(true)
    statsApi.getConstructorStandings(season)
      .then(data => setConstructors(data.constructors || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [season])

  if (loading) return (
    <div style={{ padding: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      Loading constructors...
    </div>
  )
  if (!constructors.length) return null

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Constructors · {season}
          </h3>
          <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--text-muted)' }}>
            Click to view team profile
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[-1, 1].map(dir => (
            <button
              key={dir}
              onClick={() => scroll(dir)}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={dir === -1 ? 'm15.75 19.5-7.5-7.5 7.5-7.5' : 'm8.25 4.5 7.5 7.5-7.5 7.5'} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
        }}
      >
        {constructors.map(ctor => (
          <ConstructorCard
            key={ctor.constructorId}
            ctor={ctor}
            onClick={c => onSelect({ type: 'constructor', id: c.constructorId, label: c.name })}
          />
        ))}
      </div>
    </div>
  )
}
