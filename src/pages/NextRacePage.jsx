import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import PageWrapper from '../components/layout/PageWrapper'
import { dashboardApi, circuitsApi, statsApi } from '../services/api'
import { countryFlag } from '../utils/flags'
import { useCountdown } from '../hooks/useCountdown'
import NextRaceHero from '../components/nextrace/NextRaceHero'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import CircuitStatsPanel from '../components/nextrace/CircuitStatsPanel'
import TopWinnersPanel from '../components/nextrace/TopWinnersPanel'
import CircuitMapPanel from '../components/nextrace/CircuitMapPanel'

function computeTopWinners(history) {
  if (!history?.races) return []
  const wins = {}
  for (const r of history.races) {
    const w = r.Results?.[0]?.Driver
    if (!w) continue
    const name = `${w.givenName} ${w.familyName}`
    wins[name] = (wins[name] || 0) + 1
  }
  return Object.entries(wins).sort((a, b) => b[1] - a[1]).slice(0, 5)
}

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
          if (circ.status === 'fulfilled') setCircuit(circ.value)
          if (hist.status === 'fulfilled') setHistory(hist.value)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const live      = race?.currentSession?.isLive ? race.currentSession : null
  const countdown = useCountdown(!live ? (race?.nextSession?.dateTime ?? race?.raceDateTime) : null)
  const flagUrl   = race ? countryFlag(race.country) : null
  const lat       = circuit?.Location?.lat
  const lng       = circuit?.Location?.long
  const topWinners = computeTopWinners(history)

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

  return (
    <PageWrapper>
      <button
        className="btn btn--ghost"
        style={{ fontSize: '0.75rem', marginBottom: '1rem', padding: '0.3rem 0.75rem' }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div style={{ marginBottom: '1.5rem' }}>
        <NextRaceHero
          race={race}
          circuit={circuit}
          live={live}
          countdown={countdown}
          isMobile={isMobile}
          flagUrl={flagUrl}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <WeekendSchedulePanel
          schedule={race.schedule}
          liveKey={live?.key}
          nextSessionKey={race?.nextSession?.key}
        />

        <div style={{ display: isMobile ? 'grid' : 'flex', gridTemplateColumns: '1fr 1fr', flexDirection: 'column', gap: '1rem' }}>
          <CircuitStatsPanel history={history} race={race} circuit={circuit} isMobile={isMobile} />
          <TopWinnersPanel topWinners={topWinners} />
        </div>
      </div>

      <CircuitMapPanel lat={lat} lng={lng} />
    </PageWrapper>
  )
}
