import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { constructorsApi, statsApi } from '../../services/api'
import { ctorColor } from '../../utils/teamColors'
import EmptyState from '../ui/EmptyState'
import ConstructorKPICard from '../ui/ConstructorKPICard'
import ConstructorDriverCard from './ConstructorDriverCard'
import ConstructorRacePace from './ConstructorRacePace'
import ConstructorTeamDNA from './ConstructorTeamDNA'
import ConstructorPointsProgress from './ConstructorPointsProgress'
import ConstructorLoyaltyGraph from './ConstructorLoyaltyGraph'

const WIKI_SLUGS = {
  ferrari: 'Scuderia_Ferrari', mclaren: 'McLaren', red_bull: 'Red_Bull_Racing',
  mercedes: 'Mercedes-AMG_Petronas_F1_Team', williams: 'Williams_Racing',
  alpine: 'Alpine_F1_Team', aston_martin: 'Aston_Martin_Aramco_F1_Team',
  haas: 'Haas_F1_Team', rb: 'Racing_Bulls', kick_sauber: 'Stake_F1_Team_Kick_Sauber',
  renault: 'Renault_in_Formula_One', force_india: 'Force_India',
  racing_point: 'Racing_Point_F1_Team', toro_rosso: 'Scuderia_Toro_Rosso',
  alfa: 'Alfa_Romeo_in_Formula_One', lotus_f1: 'Lotus_F1_Team', brawn: 'Brawn_GP',
  honda: 'Honda_in_Formula_One', toyota: 'Toyota_in_Formula_One',
  bmw_sauber: 'BMW_Sauber', bar: 'British_American_Racing', jaguar: 'Jaguar_Racing',
  minardi: 'Minardi', jordan: 'Jordan_Grand_Prix', tyrrell: 'Tyrrell_Racing',
  benetton: 'Benetton_Formula', brabham: 'Brabham', lotus: 'Team_Lotus',
  matra: 'Matra_(Formula_One)', stewart: 'Stewart_Grand_Prix',
  arrows: 'Arrows_Grand_Prix_International', ligier: 'Ligier',
  march: 'March_Engineering', wolf: 'Walter_Wolf_Racing',
  shadow: 'Shadow_Cars', sauber: 'Sauber_Motorsport',
}

async function fetchWikiLogo(constructorId) {
  const slug = WIKI_SLUGS[constructorId]
  if (!slug) return null
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`)
    if (!res.ok) return null
    return (await res.json()).thumbnail?.source || null
  } catch { return null }
}

const CURRENT_YEAR = String(new Date().getFullYear())

export default function ConstructorDetail({ constructorId }) {
  const [data,      setData]      = useState(null)
  const [standings, setStandings] = useState(null)
  const [logoUrl,   setLogoUrl]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const [prevStandings, setPrevStandings] = useState(null)

  useEffect(() => {
    setLoading(true); setData(null); setError(null); setLogoUrl(null); setStandings(null); setPrevStandings(null)
    const prevYear = String(parseInt(CURRENT_YEAR) - 1)
    Promise.all([
      constructorsApi.getStats(constructorId),
      fetchWikiLogo(constructorId),
      statsApi.getConstructorStandings(CURRENT_YEAR).catch(() => null),
      statsApi.getConstructorStandings(prevYear).catch(() => null),
    ])
      .then(([stats, logo, wcc, prev]) => { setData(stats); setLogoUrl(logo); setStandings(wcc); setPrevStandings(prev) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [constructorId])

  if (loading) return <EmptyState type="loading" height={220} />
  if (error)   return <EmptyState type="error"   message={error} height={120} />
  if (!data)   return null

  const color = ctorColor(constructorId)
  const { stats, seasons } = data

  // WCC KPIs from current year standings
  const wccList    = standings?.constructors || []
  const wccIdx     = wccList.findIndex(c => c.constructorId === constructorId)
  const wccPos     = wccIdx >= 0 ? wccIdx + 1 : null
  const wccPts     = wccIdx >= 0 ? wccList[wccIdx].finalPoints : null
  const leaderPts  = wccList[0]?.finalPoints ?? null
  const gap        = wccPos && wccPos > 1 ? leaderPts - wccPts : null

  // Current season drivers (most recent season in data)
  const currentSeason = seasons[0]
  const [driverA, driverB] = currentSeason?.drivers || []

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

      {/* ── Identity Banner ── */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 14, marginBottom: '1rem',
        padding: '1.75rem 1.5rem 1.25rem',
        background: `linear-gradient(135deg, ${color}28 0%, rgba(12,12,12,0.95) 65%)`,
        border: `1px solid ${color}30`,
        borderTop: `3px solid ${color}`,
      }}>
        {/* Watermark logo */}
        {logoUrl && (
          <img src={logoUrl} alt="" aria-hidden style={{
            position: 'absolute', right: '-1rem', top: '50%', transform: 'translateY(-50%)',
            height: 130, width: 'auto', opacity: 0.07, pointerEvents: 'none', filter: 'saturate(0)',
          }} />
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {/* Small logo */}
          <div style={{
            width: 56, height: 56, borderRadius: 10, flexShrink: 0,
            background: logoUrl ? 'rgba(255,255,255,0.04)' : `${color}22`,
            border: `1.5px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {logoUrl
              ? <img src={logoUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }} />
              : <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '1.3rem', color }}>{data.name[0]}</span>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 900,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-primary)', margin: 0, lineHeight: 1,
              }}>
                {data.name}
              </h2>
              {stats.championships > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.28rem',
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.18), rgba(234,179,8,0.07))',
                  border: '1px solid rgba(234,179,8,0.4)',
                  borderRadius: 6, padding: '2px 8px', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#eab308' }}>★</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#eab308' }}>
                    {stats.championships} World Championship{stats.championships !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {stats.firstSeason}{stats.firstSeason !== stats.lastSeason ? ` – ${stats.lastSeason}` : ''} · {stats.seasons} seasons
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
          <ConstructorKPICard
            label="All-Time Wins" value={stats.wins} color={color}
            sub={`${stats.podiums} podiums`}
          />
          <ConstructorKPICard
            label="All-Time Points" value={stats.points}
            sub={`${stats.poles} pole positions`}
          />
          {wccPos && (
            <ConstructorKPICard
              label={`P${wccPos} · ${CURRENT_YEAR} WCC`}
              value={wccPts}
              color={wccPos === 1 ? '#eab308' : color}
              sub={gap ? `–${gap} to leader` : 'Championship leader'}
              trend={wccPos === 1 ? 0 : undefined}
            />
          )}
          {stats.reliability != null && (
            <ConstructorKPICard
              label="Reliability" value={`${stats.reliability}%`}
              sub="classified finishes"
            />
          )}
        </div>
      </div>

      {/* ── Current Season Driver Cards ── */}
      {driverA && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <ConstructorDriverCard driver={driverA} teammate={driverB} color={color} />
          {driverB && <ConstructorDriverCard driver={driverB} teammate={driverA} color={color} />}
        </div>
      )}

      {/* ── Analytics Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="card card--mongo" style={{ padding: '1.25rem' }}>
          <ConstructorTeamDNA stats={stats} color={color} />
        </div>
        <div className="card card--mongo" style={{ padding: '1.25rem' }}>
          <ConstructorPointsProgress
            constructorId={constructorId}
            currentStandings={standings}
            prevStandings={prevStandings}
            currentYear={CURRENT_YEAR}
            color={color}
          />
          {!standings && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No {CURRENT_YEAR} standings data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Race Pace & Sector Dominance ── */}
      <div className="card card--mongo" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <ConstructorRacePace teamName={data.name} year={CURRENT_YEAR} color={color} />
      </div>

      {/* ── Loyalty Graph ── */}
      <div className="card card--mongo" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <ConstructorLoyaltyGraph constructorId={constructorId} />
      </div>

      {/* ── Season Breakdown ── */}
      <div className="card card--mongo" style={{ padding: '1.25rem' }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase',
          letterSpacing: '0.06em', fontSize: '0.82rem', color: 'var(--text-muted)',
          margin: '0 0 0.85rem',
        }}>
          Season by Season
        </h3>

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
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.88rem', fontWeight: 700, color: s.champion ? '#eab308' : s.wins > 0 ? color : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                {s.season}
                {s.champion && <span style={{ fontSize: '0.6rem', color: '#eab308' }} title="World Championship">★</span>}
              </span>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {s.drivers.map(d => (
                  <span key={d.id} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 4 }}>
                    {d.name.split(' ').pop()}
                  </span>
                ))}
              </div>
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
