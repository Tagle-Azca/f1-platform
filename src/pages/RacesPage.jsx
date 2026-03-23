import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import { racesApi } from '../services/api'
import PageHint from '../components/ui/PageHint'
import RaceCard from '../components/races/RaceCard'
import BackendError from '../components/ui/BackendError'

const CY = new Date().getFullYear()
const SEASONS = Array.from({ length: CY - 1949 }, (_, i) => String(CY - i))

export default function RacesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [races,   setRaces]   = useState([])
  const [season,  setSeason]  = useState(searchParams.get('season') || String(CY))
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    racesApi.getBySeason(season)
      .then(setRaces)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [season])

  const completedCount = races.filter(r => r.hasResults).length
  const currentRace    = races.find(r => r.isCurrentWeekend)
  const nextRace       = !currentRace && races.find(r => r.isUpcoming && !r.isCurrentWeekend)

  return (
    <PageWrapper>
      <PageHint
        id="races"
        title="Calendar"
        text="Click any race to view results, qualifying and full weekend details. The yellow badge marks the next upcoming race."
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 className="page__title" style={{ marginBottom: 0 }}>Calendar</h1>
        <select
          className="input"
          style={{ width: 120 }}
          value={season}
          onChange={(e) => {
            setSeason(e.target.value)
            setSearchParams({ season: e.target.value })
          }}
        >
          {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {!loading && races.length > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {completedCount} / {races.length} races completed
          </span>
        )}
        {currentRace && (
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '2px 9px', borderRadius: 4,
            background: 'rgba(225,6,0,0.14)', color: 'var(--f1-red)',
            border: '1px solid rgba(225,6,0,0.3)',
          }}>
            R{currentRace.round} · Active Weekend
          </span>
        )}
      </div>

      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.03em' }}>
        Tap any race to view results, qualifying and full weekend details.
      </p>

      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>}
      {error   && <BackendError onRetry={() => { setError(null); setLoading(true) }} />}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {races.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No races found for {season}.</p>}
          {races.map((race, i) => (
            <RaceCard key={`${race.season}-${race.round}`} race={race} index={i} isNextRace={nextRace && race.round === nextRace.round} />
          ))}
        </div>
      )}
    </PageWrapper>
  )
}
