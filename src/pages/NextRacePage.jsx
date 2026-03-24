import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import PageWrapper from '../components/layout/PageWrapper'
import { dashboardApi, circuitsApi, statsApi } from '../services/api'
import { getCircuitSpecs } from '../utils/circuitSpecs'
import { countryFlag } from '../utils/flags'
import { useCountdown } from '../hooks/useCountdown'
import NextRaceHero from '../components/nextrace/NextRaceHero'
import WeekendSchedulePanel from '../components/nextrace/WeekendSchedulePanel'
import RaceExpectationsPanel from '../components/nextrace/RaceExpectationsPanel'
import StrategyOutlookPanel from '../components/nextrace/StrategyOutlookPanel'
import PoleRecordPanel from '../components/nextrace/PoleRecordPanel'
import CircuitMapPanel from '../components/nextrace/CircuitMapPanel'
import LastGPPanel from '../components/nextrace/LastGPPanel'
import CircuitDNAPanel from '../components/circuits/CircuitDNAPanel'


export default function NextRacePage() {
  const { isMobile } = useBreakpoint()
  const navigate  = useNavigate()
  const [race,    setRace]    = useState(null)
  const [circuit, setCircuit] = useState(null)
  const [history, setHistory] = useState(null)
  const [weather, setWeather] = useState(null)
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

  useEffect(() => {
    const clat = circuit?.Location?.lat
    const clng = circuit?.Location?.long
    if (!clat || !clng || !race?.schedule) return
    const dates = Object.values(race.schedule).map(s => s.date).filter(Boolean)
    if (!dates.length) return
    const start = dates.reduce((a, b) => a < b ? a : b)
    const end   = dates.reduce((a, b) => a > b ? a : b)
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${clat}&longitude=${clng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${start}&end_date=${end}`)
      .then(r => r.json())
      .then(data => {
        if (!data.daily) return
        const map = {}
        data.daily.time.forEach((date, i) => {
          map[date] = {
            tempMax:     Math.round(data.daily.temperature_2m_max[i]),
            tempMin:     Math.round(data.daily.temperature_2m_min[i]),
            precipProb:  data.daily.precipitation_probability_max[i],
            code:        data.daily.weathercode[i],
          }
        })
        setWeather(map)
      })
      .catch(() => {})
  }, [circuit, race?.schedule])

  const live      = race?.currentSession?.isLive ? race.currentSession : null
  const countdown = useCountdown(!live ? (race?.nextSession?.dateTime ?? race?.raceDateTime) : null)
  const flagUrl   = race ? countryFlag(race.country) : null
  const lat       = circuit?.Location?.lat
  const lng       = circuit?.Location?.long
  const trackSpecs = race?.circuitId ? getCircuitSpecs(race.circuitId) : null

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
        style={{ fontSize: isMobile ? '0.85rem' : '0.75rem', marginBottom: '1rem', padding: isMobile ? '0.6rem 1rem' : '0.3rem 0.75rem' }}
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

      {isMobile ? (
        /* ── Mobile: single column, logical reading order ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <WeekendSchedulePanel
            schedule={race.schedule}
            liveKey={live?.key}
            nextSessionKey={race?.nextSession?.key}
            weather={weather}
          />
          {history && <LastGPPanel history={history} />}
          <CircuitMapPanel lat={lat} lng={lng} />
          <RaceExpectationsPanel specs={trackSpecs} />
          <StrategyOutlookPanel specs={trackSpecs} />
          <PoleRecordPanel specs={trackSpecs} />
          {race.circuitId && <CircuitDNAPanel circuit={{ circuitId: race.circuitId }} compact />}
        </div>
      ) : (
        /* ── Desktop: 3-column command centre — logistics · dynamics · technical ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr 1fr',
          gap: '1rem',
          alignItems: 'stretch',
        }}>

          {/* ── Col 1: Schedule + Last Time Here ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <WeekendSchedulePanel
              schedule={race.schedule}
              liveKey={live?.key}
              nextSessionKey={race?.nextSession?.key}
              weather={weather}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {history && <LastGPPanel history={history} />}
            </div>
          </div>

          {/* ── Col 2: Map · Race Expectations · Strategy Outlook ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Map: explicit height on the iframe — no flex-1 trickery needed */}
            <CircuitMapPanel lat={lat} lng={lng} />
            <RaceExpectationsPanel specs={trackSpecs} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <StrategyOutlookPanel specs={trackSpecs} />
            </div>
          </div>

          {/* ── Col 3: Track Specs (2-col internal grid) · Circuit DNA (radar + 5 stats) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <PoleRecordPanel specs={trackSpecs} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {race.circuitId && <CircuitDNAPanel circuit={{ circuitId: race.circuitId }} compact />}
            </div>
          </div>

        </div>
      )}
    </PageWrapper>
  )
}
