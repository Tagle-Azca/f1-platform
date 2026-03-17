import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import { dashboardApi, circuitsApi, statsApi } from '../services/api'
import { countryFlag } from '../utils/flags'
import CircuitSilhouette from '../components/circuit/CircuitSilhouette'
import AccentBanner from '../components/ui/AccentBanner'
import CountdownDisplay from '../components/ui/CountdownDisplay'
import Panel from '../components/ui/Panel'
import { useCountdown } from '../hooks/useCountdown'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'

export default function NextRacePage() {
  const { isMobile } = useBreakpoint()
  const navigate  = useNavigate()
  const [race,    setRace]    = useState(null)
  const [circuit, setCircuit] = useState(null)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(async data => {
        const nr = data?.nextRace
        if (!nr) { setLoading(false); return }
        setRace(nr)
        if (nr.circuitId) {
          const [circ, hist] = await Promise.allSettled([
            circuitsApi.getById(nr.circuitId),
            statsApi.circuitHistory(nr.circuitId),
          ])
          if (circ.status === 'fulfilled')  setCircuit(circ.value)
          if (hist.status === 'fulfilled')  setHistory(hist.value)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const live           = race?.currentSession?.isLive ? race.currentSession : null
  const countdown      = useCountdown(!live ? (race?.nextSession?.dateTime ?? race?.raceDateTime) : null)
  const nextSessionKey = live ? race?.nextSession?.key : race?.nextSession?.key
  const flagUrl   = race ? countryFlag(race.country) : null
  const lat       = circuit?.Location?.lat
  const lng       = circuit?.Location?.long

  if (loading) return (
    <PageWrapper>
      <p style={{ color: 'var(--text-muted)' }}>Loading next race...</p>
    </PageWrapper>
  )
  if (!race) return (
    <PageWrapper>
      <p style={{ color: 'var(--text-muted)' }}>No upcoming races found.</p>
    </PageWrapper>
  )

  const topWinners = (() => {
    if (!history?.races) return []
    const wins = {}
    for (const r of history.races) {
      const w = r.Results?.[0]?.Driver
      if (!w) continue
      const name = `${w.givenName} ${w.familyName}`
      wins[name] = (wins[name] || 0) + 1
    }
    return Object.entries(wins).sort((a, b) => b[1] - a[1]).slice(0, 5)
  })()

  const lastWinner = history?.races?.[0]?.Results?.[0]?.Driver

  return (
    <PageWrapper>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn btn--ghost"
          style={{ fontSize: '0.75rem', marginBottom: '1rem', padding: '0.3rem 0.75rem' }}
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <AccentBanner color="var(--f1-red)" radius={16} style={{
          position: 'relative',
          overflow: 'hidden',
          padding: isMobile ? '1rem 1.25rem' : '1.5rem 2rem',
          maxWidth: '100%',
        }}>
          {/* Desktop: circuit silhouette background */}
          {!isMobile && circuit?.trackCoords?.length && (
            <div style={{
              position: 'absolute', right: '1rem', top: '50%',
              transform: 'translateY(-50%)', opacity: 0.18, pointerEvents: 'none',
            }}>
              <CircuitSilhouette coords={circuit.trackCoords} color="#e8002d" width={260} height={170} strokeWidth={3} animate />
            </div>
          )}

          {isMobile ? (
            /* ── Mobile: stacked layout ─────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Row 1: flag + full name + location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {flagUrl && (
                  <img src={flagUrl} alt={race.country}
                    style={{ width: 44, height: 'auto', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', flexShrink: 0 }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--f1-red)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                    Round {race.round} · {race.season}
                  </div>
                  <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.55rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>
                    {race.raceName}
                  </h1>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: 0 }}>
                    {circuit?.circuitName || race.circuit} · {race.locality}, {race.country}
                  </p>
                </div>
              </div>

              {/* Row 2: silhouette + countdown side by side */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', overflow: 'hidden' }}>
                {circuit?.trackCoords?.length ? (
                  <div style={{ opacity: 0.5, flex: '0 1 auto', minWidth: 0, overflow: 'hidden' }}>
                    <CircuitSilhouette coords={circuit.trackCoords} color="#e8002d" width={110} height={68} strokeWidth={2.5} animate />
                  </div>
                ) : <div />}

                {live ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444' }}>{live.label}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '0.3rem 0.75rem' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 900, color: '#ef4444', letterSpacing: '0.1em' }}>LIVE NOW</span>
                    </div>
                  </div>
                ) : countdown && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                    {race.nextSession?.label && (
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--f1-red)' }}>
                        {race.nextSession.label}
                      </div>
                    )}
                    <CountdownDisplay parts={countdown} size="sm" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Desktop: original side-by-side layout ──── */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {flagUrl && (
                  <img src={flagUrl} alt={race.country}
                    style={{ width: 64, height: 'auto', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                  />
                )}
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--f1-red)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Round {race.round} · {race.season}
                  </div>
                  <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1 }}>
                    {race.raceName}
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.3rem', marginBottom: 0 }}>
                    {circuit?.circuitName || race.circuit} · {race.locality}, {race.country}
                  </p>
                </div>
              </div>

              {live ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444' }}>{live.label}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '0.35rem 1rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.2rem', fontWeight: 900, color: '#ef4444', letterSpacing: '0.1em' }}>LIVE NOW</span>
                  </div>
                </div>
              ) : countdown && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  {race.nextSession?.label && (
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--f1-red)' }}>
                      {race.nextSession.label}
                    </div>
                  )}
                  <CountdownDisplay parts={countdown} size="lg" />
                </div>
              )}
            </div>
          )}
        </AccentBanner>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* ── Weekend Schedule ───────────────────────────────── */}
        <WeekendSchedulePanel
          schedule={race.schedule}
          liveKey={live?.key}
          nextSessionKey={nextSessionKey}
        />

        {/* ── Circuit Stats ─────────────────────────────────── */}
        <div style={{ display: isMobile ? 'grid' : 'flex', gridTemplateColumns: '1fr 1fr', flexDirection: 'column', gap: '1rem' }}>
          {/* Stat pills */}
          {history && (
            <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Circuit Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { label: 'Races held',   value: history.races?.length ?? '—' },
                  { label: 'Last winner', value: lastWinner ? `${lastWinner.givenName} ${lastWinner.familyName}` : '—' },
                  { label: 'Country',     value: race.country },
                  { label: 'Circuit',     value: circuit?.circuitName || race.circuit },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Top winners at this circuit */}
          {topWinners.length > 0 && (
            <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                Most Wins Here
              </div>
              {topWinners.map(([name, wins], i) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0', borderBottom: i < topWinners.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 900, color: 'var(--text-muted)', width: 20, textAlign: 'center' }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e8002d' }}>{wins}x</span>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>

      {/* ── Interactive Map ────────────────────────────────── */}
      {lat && lng && (
        <Panel padding="none" as={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Circuit Location
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {parseFloat(lat).toFixed(4)}°, {parseFloat(lng).toFixed(4)}°
            </span>
          </div>
          <iframe
            title="Circuit Map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng)-0.012},${parseFloat(lat)-0.008},${parseFloat(lng)+0.012},${parseFloat(lat)+0.008}&layer=mapnik&marker=${lat},${lng}`}
            style={{ width: '100%', height: 380, border: 'none', display: 'block', filter: 'invert(0.92) hue-rotate(180deg) saturate(0.7)' }}
            loading="lazy"
          />
        </Panel>
      )}

    </PageWrapper>
  )
}
