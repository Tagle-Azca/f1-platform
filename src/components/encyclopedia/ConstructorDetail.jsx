import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { constructorsApi } from '../../services/api'
import { ctorColor } from '../../utils/teamColors'
import EmptyState from '../ui/EmptyState'

// Wikipedia article slugs per constructorId — used to fetch team logo thumbnails
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

async function fetchWikiLogo(constructorId) {
  const slug = WIKI_SLUGS[constructorId]
  if (!slug) return null
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.thumbnail?.source || null
  } catch {
    return null
  }
}

const STAT_CONFIG = [
  { key: 'races',   label: 'Races' },
  { key: 'wins',    label: 'Wins',    accent: true },
  { key: 'podiums', label: 'Podiums' },
  { key: 'poles',   label: 'Poles' },
  { key: 'points',  label: 'Points' },
  { key: 'seasons', label: 'Seasons' },
]

export default function ConstructorDetail({ constructorId }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)

  useEffect(() => {
    setLoading(true)
    setData(null)
    setError(null)
    setLogoUrl(null)
    Promise.all([
      constructorsApi.getStats(constructorId),
      fetchWikiLogo(constructorId),
    ])
      .then(([stats, logo]) => { setData(stats); setLogoUrl(logo) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [constructorId])

  if (loading) return <EmptyState type="loading" height={220} />
  if (error)   return <EmptyState type="error"   message={error} height={120} />
  if (!data)   return null

  const color = ctorColor(constructorId)
  const { stats, seasons } = data

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* Header */}
      <div className="card card--mongo" style={{
        padding: '1.5rem',
        marginBottom: '1rem',
        borderTop: `3px solid ${color}`,
        background: `linear-gradient(135deg, ${color}12, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Logo / fallback */}
          <div style={{
            width: 72, height: 72, borderRadius: 12, flexShrink: 0,
            background: logoUrl ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${color}55, ${color}22)`,
            border: `2px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {logoUrl
              ? <img src={logoUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
              : <span style={{ fontSize: '1.5rem', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color }}>{data.name.charAt(0)}</span>
            }
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              color: 'var(--text-primary)', marginBottom: '0.2rem',
            }}>
              {data.name}
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {stats.firstSeason}
              {stats.firstSeason !== stats.lastSeason ? ` – ${stats.lastSeason}` : ''}
              {' · '}{stats.seasons} season{stats.seasons !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginTop: '1.25rem' }}>
          {STAT_CONFIG.map(({ key, label, accent }) => (
            <div key={key} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: accent ? color : 'var(--text-primary)' }}>
                {stats[key] ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Season breakdown */}
      <div className="card card--mongo" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase',
            letterSpacing: '0.06em', fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0,
          }}>
            Season by Season
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.6 }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Won at least 1 race</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--surface-2)' }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No wins</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 420, overflowY: 'auto' }}>
          {seasons.map(s => (
            <div key={s.season} style={{
              display: 'grid', gridTemplateColumns: '3.5rem 1fr auto',
              alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.6rem', borderRadius: 6,
              background: s.wins > 0 ? `${color}0d` : 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = s.wins > 0 ? `${color}0d` : 'transparent'}
            >
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: s.wins > 0 ? color : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {s.season}
              </span>

              {/* Driver avatars */}
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {s.drivers.map(d => (
                  <span key={d.id} style={{
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                    background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 4,
                  }}>
                    {d.name.split(' ').pop()}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                {s.wins > 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}18`, padding: '1px 7px', borderRadius: 4 }}>
                    {s.wins}W
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', minWidth: '3.5rem', textAlign: 'right' }}>
                  {s.points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
