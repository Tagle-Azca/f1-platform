import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
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
import SectionDisclosure from '../components/nextrace/SectionDisclosure'
import CircuitSpecStrip from '../components/nextrace/CircuitSpecStrip'
import VizSkeleton from '../components/viz/VizSkeleton'
import Panel from '../components/ui/Panel'
import EmptyState from '../components/ui/EmptyState'
import { Link } from 'react-router-dom'
import { normalizeNextRace } from '../utils/normalizeDashboard'


export default function NextRacePage() {
  const [race,    setRace]    = useState(null)
  const [circuit, setCircuit] = useState(null)
  const [history, setHistory] = useState(null)
  const [weather, setWeather] = useState(null)
  const [weatherFailed, setWeatherFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    dashboardApi.get()
      .then(async data => {
        const nr = normalizeNextRace(data?.nextRace)
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
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  useEffect(() => {
    const clat = circuit?.Location?.lat
    const clng = circuit?.Location?.long
    if (!clat || !clng || !race?.schedule) return
    const dates = Object.values(race.schedule).map(s => s.date).filter(d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    if (!dates.length) return
    const start = dates.reduce((a, b) => a < b ? a : b)
    const end   = dates.reduce((a, b) => a > b ? a : b)

    // Open-Meteo forecast only covers the next 16 days — skip if race is too far out
    const today      = new Date(); today.setHours(0, 0, 0, 0)
    const startDate  = new Date(start)
    const diffDays   = Math.floor((startDate - today) / 86400000)
    if (diffDays > 16) return

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${clat}&longitude=${clng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${start}&end_date=${end}`)
      .then(r => { if (!r.ok) return null; return r.json() })
      .then(data => {
        if (!data?.daily) { setWeatherFailed(true); return }
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
      .catch(() => { setWeatherFailed(true) })
  }, [circuit, race?.schedule])

  const live      = race?.currentSession?.isLive ? race.currentSession : null
  const countdown = useCountdown(!live ? (race?.nextSession?.dateTime ?? race?.raceDateTime) : null)
  const flagUrl   = race ? countryFlag(race.country) : null
  const lat       = circuit?.Location?.lat
  const lng       = circuit?.Location?.long
  const trackSpecs = race?.circuitId ? getCircuitSpecs(race.circuitId) : null

  if (loading) return (
    <PageWrapper stagger>
      <h1 className="sr-only">Next race</h1>
      <div className="flex flex-col gap-pw-7">
        <Panel as="section" aria-label="Next race"><VizSkeleton variant="hero" name="next race" /></Panel>
        <section className="section"><h2 className="text-heading mb-pw-3 text-ink">Weekend schedule</h2><VizSkeleton variant="timeline" name="schedule" /></section>
      </div>
    </PageWrapper>
  )

  if (error && !race) return (
    <PageWrapper stagger>
      <h1 className="text-title mb-pw-3 text-ink">Next race</h1>
      <EmptyState type="error" message="Race data is unavailable right now." height={160}
        action={<button type="button" className="btn btn--ghost btn--sentence" onClick={() => window.location.reload()}>Try again</button>} />
    </PageWrapper>
  )

  if (!race) return (
    <PageWrapper stagger>
      <h1 className="text-title mb-pw-3 text-ink">Next race</h1>
      <div className="panel panel--md text-center">
        <p className="text-base text-ink-2">Season complete. See the archive.</p>
        <Link to="/races" className="btn btn--primary btn--sentence mt-pw-3 no-underline">Browse races</Link>
      </div>
    </PageWrapper>
  )

  return (
    <PageWrapper stagger>
      <div className="flex flex-col gap-pw-7 lg:gap-pw-8">
        <Rise index={0}>
          <NextRaceHero race={race} circuit={circuit} live={live} countdown={countdown} flagUrl={flagUrl} />
        </Rise>

        <Rise index={1}>
          <WeekendSchedulePanel
            schedule={race.schedule}
            liveKey={live?.key}
            nextSessionKey={race?.nextSession?.key}
            weather={weather}
            weatherFailed={weatherFailed && !weather}
          />
        </Rise>

        {(trackSpecs || history) && (
          <Rise index={2} className="grid grid-cols-1 items-start gap-x-pw-6 gap-y-pw-7 lg:grid-cols-12">
            {trackSpecs && (
              <section className="section min-w-0 lg:col-span-7" aria-labelledby="circuit-h">
                <h2 id="circuit-h" className="text-heading mb-pw-4 text-ink">The circuit</h2>
                <CircuitSpecStrip specs={trackSpecs} />
                <PoleRecordPanel specs={trackSpecs} hideFeatured />
                <div className="mt-pw-6 grid grid-cols-1 gap-x-pw-6 gap-y-pw-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">What to expect</h3>
                    <RaceExpectationsPanel specs={trackSpecs} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">Strategy</h3>
                    <StrategyOutlookPanel specs={trackSpecs} />
                  </div>
                </div>
              </section>
            )}
            {history && (
              <section className="section min-w-0 lg:col-span-5" aria-labelledby="last-gp-h">
                <h2 id="last-gp-h" className="text-heading mb-pw-4 text-ink">Last time here</h2>
                <LastGPPanel history={history} />
              </section>
            )}
          </Rise>
        )}

        {(lat && lng) || race.circuitId ? (
          <Rise index={3} className="grid grid-cols-1 items-start gap-x-pw-6 gap-y-pw-7 lg:grid-cols-12">
            {lat && lng && (
              <div className="min-w-0 lg:col-span-6"><CircuitMapPanel lat={lat} lng={lng} coords={circuit?.trackCoords} /></div>
            )}
            {race.circuitId && (
              <div className="min-w-0 lg:col-span-6">
                <SectionDisclosure title="Circuit DNA">
                  <CircuitDNAPanel circuit={{ circuitId: race.circuitId }} compact theme="viz" bare />
                </SectionDisclosure>
              </div>
            )}
          </Rise>
        ) : null}
      </div>
    </PageWrapper>
  )
}
