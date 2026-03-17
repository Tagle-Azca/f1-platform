import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Panel from '../components/ui/Panel'
import StatCard from '../components/ui/StatCard'
import TabBar from '../components/ui/TabBar'
import EmptyState from '../components/ui/EmptyState'
import { racesApi } from '../services/api'
import { PODIUM_COLORS, ctorColor } from '../utils/teamColors'
import StatusBadge from '../components/race/StatusBadge'
import Delta, { positionDelta } from '../components/race/PositionDelta'
import PageHint from '../components/ui/PageHint'
import CircuitSilhouette from '../components/circuit/CircuitSilhouette'
import { fmtDate } from '../utils/date'
import { SESSION_DURATION_MIN } from '../utils/sessionConfig'
import WeekendSchedule from '../components/race/WeekendSchedule'
import PracticePanel from '../components/race/PracticePanel'
import DriverDrawer from '../components/ui/DriverDrawer'

const RaceTelemetrySection = lazy(() => import('../components/race/RaceTelemetrySection'))

function isSessionPast(dateStr, timeStr) {
  if (!dateStr) return false
  const dt    = new Date(`${dateStr}T${(timeStr || '00:00:00').replace(/Z$/i, '')}Z`)
  const endDt = new Date(dt.getTime() + (SESSION_DURATION_MIN['race'] || 90) * 60 * 1000)
  return endDt < new Date()
}

function formatSessionDT(dateStr, timeStr) {
  if (!dateStr) return ''
  const dt = new Date(`${dateStr}T${(timeStr || '00:00:00').replace(/Z$/i, '')}Z`)
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
    + (timeStr ? ' · ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' local' : '')
}

function formatTime(time) {
  if (!time || time === 'N/A') return '—'
  return time
}

export default function RaceDetailPage() {
  const { isMobile } = useBreakpoint()
  const { season, round } = useParams()
  const navigate = useNavigate()
  const [race,    setRace]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [tab, setTab] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)

  useEffect(() => {
    setTab(null)
    setLoading(true)
    racesApi.getByRound(season, round)
      .then(setRace)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [season, round])

  const goToTelemetry = useCallback(
    () => navigate(`/telemetry?year=${season}`),
    [navigate, season]
  )

  const results                 = race?.Results                 || []
  const sprintResults           = race?.SprintResults           || []
  const qualifyingResults       = race?.QualifyingResults       || []
  const sprintQualifyingResults = race?.SprintQualifyingResults || []
  const schedule                = race?.schedule                || null

  // isSprint: backend sets schedule.isSprint; fallback to result arrays if schedule not yet loaded
  const isSprint = !!(schedule?.isSprint || sprintResults.length || sprintQualifyingResults.length)

  const SPRINT_BADGE = <span style={{ marginLeft: '0.35rem', fontSize: '0.55rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: 3, padding: '1px 4px' }}>SPRINT</span>

  const TABS = useMemo(() => {
    const t = []
    // Practice 1
    if (schedule?.fp1) t.push({ id: 'fp1', label: 'FP1' })
    if (isSprint) {
      // Sprint weekend: FP1 → Sprint Shootout → Sprint → Qualifying → Race
      if (schedule?.sprintQualifying || sprintQualifyingResults.length)
        t.push({ id: 'sq',     label: 'Sprint Shootout', badge: SPRINT_BADGE })
      if (schedule?.sprint || sprintResults.length)
        t.push({ id: 'sprint', label: 'Sprint',          badge: SPRINT_BADGE })
    } else {
      // Normal weekend: FP1 → FP2 → FP3 → Qualifying → Race
      if (schedule?.fp2) t.push({ id: 'fp2', label: 'FP2' })
      if (schedule?.fp3) t.push({ id: 'fp3', label: 'FP3' })
    }
    // Qualifying — show if schedule has it or we already have results
    if (schedule?.qualifying || qualifyingResults.length)
      t.push({ id: 'quali', label: 'Qualifying' })
    // Race — always shown
    t.push({ id: 'race', label: 'Race Results' })
    return t
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length, qualifyingResults.length, sprintResults.length, sprintQualifyingResults.length, schedule, isSprint])

  if (loading) return (
    <PageWrapper>
      <EmptyState type="loading" message="Loading race..." height={120} />
    </PageWrapper>
  )
  if (error || !race) return (
    <PageWrapper>
      <EmptyState type="error" message={error || 'Race not found'} height={120} />
    </PageWrapper>
  )

  // Default to Race Results if available (and past), otherwise first tab
  const activeTab = tab || (results.length ? 'race' : (TABS[0]?.id ?? null))

  const winner     = results.find(r => r.position === '1') || results[0]
  const pole       = qualifyingResults[0] ?? results.find(r => r.grid === '1')
  const fastestLap = results.find(r => r.FastestLap?.rank === '1')
  const dnfCount   = results.filter(r => r.status !== 'Finished' && !r.status?.startsWith('+')).length
  const totalLaps  = winner?.laps ? `${winner.laps} laps` : null
  const isUpcoming = !results.length

  return (
    <>
    <PageWrapper>
      {/* Back button */}
      <button
        className="btn btn--ghost"
        style={{ fontSize: '0.75rem', marginBottom: '1rem', padding: '0.3rem 0.75rem' }}
        onClick={() => navigate(`/races?season=${season}`)}
      >
        ← Back to Races
      </button>
      <PageHint
        id="race_detail"
        title="Race Detail"
        text="Navigate between weekend sessions using the tabs. In Race Results, the arrows show positions gained or lost from the starting grid."
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
      />

      {/* Hero header */}
      <Panel padding="none" style={{
        position: 'relative',
        marginBottom: '1.25rem',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        minHeight: 120,
        overflow: 'hidden',
      }}>
        {/* Subtle red accent line at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, var(--f1-red), transparent)`,
        }} />

        {/* Left: race info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
            <span style={{
              fontFamily: 'var(--font-condensed)',
              fontSize: '2.2rem', fontWeight: 900,
              color: 'rgba(255,255,255,0.15)', lineHeight: 1,
              userSelect: 'none',
            }}>
              R{race.round}
            </span>
            <h1 className="page__title" style={{ marginBottom: 0 }}>{race.raceName}</h1>
          </div>
          <p className="page__subtitle" style={{ marginBottom: '0.75rem' }}>
            {race.Circuit?.circuitName} · {race.Circuit?.Location?.locality}, {race.Circuit?.Location?.country} · {fmtDate(race.date)}
          </p>
          <span className="db-badge db-badge--mongo">MongoDB</span>
        </div>

        {/* Right: circuit silhouette */}
        {race.Circuit?.trackCoords?.length && (
          <div style={{
            flexShrink: 0,
            opacity: 0.85,
            filter: 'drop-shadow(0 0 12px rgba(225,6,0,0.2))',
          }}>
            <CircuitSilhouette
              coords={race.Circuit.trackCoords}
              color="var(--f1-red)"
              width={220}
              height={140}
              strokeWidth={2.5}
              animate
            />
          </div>
        )}
      </Panel>

      {/* Weekend Schedule (always shown if available) */}
      <WeekendSchedule schedule={race.schedule} />

      {/* Stat cards — only for completed races */}
      {!isUpcoming && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <StatCard
            label="Winner"
            value={winner ? `${winner.Driver.givenName} ${winner.Driver.familyName}` : '—'}
            sub={winner?.Constructor?.name}
            accent={winner ? ctorColor(winner.Constructor?.constructorId) : undefined}
          />
          <StatCard
            label="Pole Position"
            value={pole ? `${pole.Driver.givenName} ${pole.Driver.familyName}` : '—'}
            sub={pole?.Constructor?.name}
            accent={pole ? ctorColor(pole.Constructor?.constructorId) : undefined}
          />
          <StatCard
            label="Fastest Lap"
            value={fastestLap ? `${fastestLap.Driver.givenName} ${fastestLap.Driver.familyName}` : '—'}
            sub={fastestLap?.FastestLap?.Time?.time}
          />
          <StatCard
            label={dnfCount > 0 ? 'DNFs' : 'Race Laps'}
            value={dnfCount > 0 ? String(dnfCount) : (totalLaps || '—')}
            sub={dnfCount > 0 ? (totalLaps || `${results.length} classified`) : `${results.length} classified`}
          />
        </div>
      )}

      {/* Tabs */}
      {TABS.length > 0 && (
      <Panel padding="none" className="card" style={{ overflow: 'hidden', overflowX: 'auto' }}>

        <TabBar
          variant="underline"
          accentColor="var(--f1-red)"
          tabs={TABS}
          activeTab={activeTab}
          onChange={setTab}
        />

        {/* Practice sessions */}
        {['fp1', 'fp2', 'fp3'].includes(activeTab) && (
          <PracticePanel
            sessionKey={activeTab}
            scheduleEntry={schedule?.[activeTab]}
            season={season}
            onGoTelemetry={goToTelemetry}
          />
        )}

        {/* Race Results */}
        {activeTab === 'race' && !results.length && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ opacity: 0.15, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" style={{ width: 40, height: 40 }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Results not available yet</p>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>Check back after the race on {fmtDate(race.date)}</p>
          </div>
        )}
        {activeTab === 'race' && !!results.length && <div style={{ minWidth: isMobile ? 540 : 0 }}>
          <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '2.5rem 1.5rem 1fr 1fr 3rem 4rem 3.5rem 4.5rem', gap: '0 0.75rem', padding: '0.45rem 1.25rem' }}>
            <span>Pos</span><span>No.</span><span>Driver</span><span>Constructor</span>
            <span style={{ textAlign:'center' }}>Grid</span><span style={{ textAlign:'center' }}>+/−</span>
            <span style={{ textAlign:'right' }}>Pts</span><span style={{ textAlign:'right' }}>Status</span>
          </div>
          {results.map((r, i) => {
            const color = ctorColor(r.Constructor?.constructorId)
            const delta = positionDelta(r)
            const isFirst = i === 0
            const podiumColor = PODIUM_COLORS[i] ?? null
            return (
              <motion.div key={r.Driver?.driverId || i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.02 }}
                className="row-divider"
                style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 3rem 4rem 3.5rem 4.5rem', gap:'0 0.75rem', padding:'0.55rem 1.25rem', alignItems:'center', borderBottom: i < results.length-1 ? '1px solid var(--border-subtle)' : 'none', background: isFirst ? 'var(--surface-3)' : 'transparent', borderLeft: isFirst ? `3px solid ${color}` : '3px solid transparent' }}>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'1rem', fontWeight:900, color: podiumColor || 'var(--text-muted)' }}>{r.position === '\\N' ? 'DNF' : r.position}</span>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'0.75rem', fontWeight:700, color, opacity:0.8 }}>{r.Driver?.permanentNumber || r.Driver?.code || '—'}</span>
                <div
                  onClick={!isMobile && r.Driver?.driverId ? () => setSelectedDriver({ driverId: r.Driver.driverId, name: `${r.Driver.givenName} ${r.Driver.familyName}` }) : undefined}
                  style={{ cursor: !isMobile && r.Driver?.driverId ? 'pointer' : undefined }}
                >
                  <div style={{ fontSize:'0.82rem', fontWeight: isFirst ? 700 : 500 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{r.Driver?.nationality}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <div style={{ width:3, height:18, borderRadius:2, background:color, flexShrink:0 }} />
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{r.Constructor?.name || '—'}</span>
                </div>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', textAlign:'center' }}>{r.grid === '0' ? 'PL' : r.grid || '—'}</span>
                <div style={{ textAlign:'center' }}><Delta value={delta} /></div>
                <span style={{ fontSize:'0.82rem', fontWeight:700, textAlign:'right', color: parseFloat(r.points)>0 ? color : 'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{parseFloat(r.points)>0 ? r.points : '—'}</span>
                <div style={{ textAlign:'right' }}><StatusBadge status={r.status} /></div>
              </motion.div>
            )
          })}
        </div>}

        {/* Qualifying */}
        {activeTab === 'quali' && !qualifyingResults.length && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Qualifying results not available yet</p>
            {schedule?.qualifying && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>
                {formatSessionDT(schedule.qualifying.date, schedule.qualifying.time)}
              </p>
            )}
          </div>
        )}
        {activeTab === 'quali' && !!qualifyingResults.length && <div style={{ minWidth: 480 }}>
          <div className="table-header" style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 4.5rem 4.5rem 4.5rem', gap:'0 0.75rem', padding:'0.45rem 1.25rem' }}>
            <span>Pos</span><span>No.</span><span>Driver</span><span>Constructor</span>
            <span style={{ textAlign:'right' }}>Q1</span><span style={{ textAlign:'right' }}>Q2</span><span style={{ textAlign:'right' }}>Q3</span>
          </div>
          {qualifyingResults.map((r, i) => {
            const color = ctorColor(r.Constructor?.constructorId)
            const isFirst = i === 0
            return (
              <div key={r.Driver?.driverId || i} style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 4.5rem 4.5rem 4.5rem', gap:'0 0.75rem', padding:'0.55rem 1.25rem', alignItems:'center', borderBottom: i < qualifyingResults.length-1 ? '1px solid var(--border-subtle)' : 'none', background: isFirst ? 'var(--surface-3)' : 'transparent', borderLeft: isFirst ? `3px solid ${color}` : '3px solid transparent' }}>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'1rem', fontWeight:900, color: isFirst ? color : 'var(--text-muted)' }}>{r.position}</span>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'0.75rem', fontWeight:700, color, opacity:0.8 }}>{r.Driver?.permanentNumber || r.Driver?.code || '—'}</span>
                <div
                  onClick={!isMobile && r.Driver?.driverId ? () => setSelectedDriver({ driverId: r.Driver.driverId, name: `${r.Driver.givenName} ${r.Driver.familyName}` }) : undefined}
                  style={{ cursor: !isMobile && r.Driver?.driverId ? 'pointer' : undefined }}
                >
                  <div style={{ fontSize:'0.82rem', fontWeight: isFirst ? 700 : 500 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{r.Driver?.nationality}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <div style={{ width:3, height:18, borderRadius:2, background:color, flexShrink:0 }} />
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{r.Constructor?.name || '—'}</span>
                </div>
                {['Q1','Q2','Q3'].map(q => (
                  <span key={q} style={{ fontSize:'0.78rem', textAlign:'right', color: r[q] ? (isFirst && q==='Q3' ? color : 'var(--text-primary)') : 'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>
                    {r[q] || '—'}
                  </span>
                ))}
              </div>
            )
          })}
        </div>}

        {/* Sprint Results */}
        {activeTab === 'sprint' && !sprintResults.length && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Sprint results not available yet</p>
            {schedule?.sprint && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>
                {formatSessionDT(schedule.sprint.date, schedule.sprint.time)}
              </p>
            )}
          </div>
        )}
        {activeTab === 'sprint' && !!sprintResults.length && <div style={{ minWidth: 540 }}>
          <div className="table-header" style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 3rem 4rem 3.5rem 4.5rem', gap:'0 0.75rem', padding:'0.45rem 1.25rem' }}>
            <span>Pos</span><span>No.</span><span>Driver</span><span>Constructor</span>
            <span style={{ textAlign:'center' }}>Grid</span><span style={{ textAlign:'center' }}>+/−</span>
            <span style={{ textAlign:'right' }}>Pts</span><span style={{ textAlign:'right' }}>Status</span>
          </div>
          {sprintResults.map((r, i) => {
            const color = ctorColor(r.Constructor?.constructorId)
            const delta = positionDelta(r)
            const isFirst = i === 0
            const podiumColor = PODIUM_COLORS[i] ?? null
            return (
              <motion.div key={r.Driver?.driverId || i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.02 }}
                style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 3rem 4rem 3.5rem 4.5rem', gap:'0 0.75rem', padding:'0.55rem 1.25rem', alignItems:'center', borderBottom: i < sprintResults.length-1 ? '1px solid var(--border-subtle)' : 'none', background: isFirst ? 'var(--surface-3)' : 'transparent', borderLeft: isFirst ? `3px solid ${color}` : '3px solid transparent' }}>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'1rem', fontWeight:900, color: podiumColor || 'var(--text-muted)' }}>{r.position === '\\N' ? 'DNF' : r.position}</span>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'0.75rem', fontWeight:700, color, opacity:0.8 }}>{r.Driver?.permanentNumber || r.Driver?.code || '—'}</span>
                <div
                  onClick={!isMobile && r.Driver?.driverId ? () => setSelectedDriver({ driverId: r.Driver.driverId, name: `${r.Driver.givenName} ${r.Driver.familyName}` }) : undefined}
                  style={{ cursor: !isMobile && r.Driver?.driverId ? 'pointer' : undefined }}
                >
                  <div style={{ fontSize:'0.82rem', fontWeight: isFirst ? 700 : 500 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{r.Driver?.nationality}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <div style={{ width:3, height:18, borderRadius:2, background:color, flexShrink:0 }} />
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{r.Constructor?.name || '—'}</span>
                </div>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', textAlign:'center' }}>{r.grid === '0' ? 'PL' : r.grid || '—'}</span>
                <div style={{ textAlign:'center' }}><Delta value={delta} /></div>
                <span style={{ fontSize:'0.82rem', fontWeight:700, textAlign:'right', color: parseFloat(r.points)>0 ? color : 'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>{parseFloat(r.points)>0 ? r.points : '—'}</span>
                <div style={{ textAlign:'right' }}><StatusBadge status={r.status} /></div>
              </motion.div>
            )
          })}
        </div>}

        {/* Sprint Qualifying / Shootout */}
        {activeTab === 'sq' && !sprintQualifyingResults.length && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Sprint Shootout results not available yet</p>
            {schedule?.sprintQualifying && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem' }}>
                {formatSessionDT(schedule.sprintQualifying.date, schedule.sprintQualifying.time)}
              </p>
            )}
          </div>
        )}
        {activeTab === 'sq' && !!sprintQualifyingResults.length && <div style={{ minWidth: 480 }}>
          <div className="table-header" style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 4.5rem 4.5rem 4.5rem', gap:'0 0.75rem', padding:'0.45rem 1.25rem' }}>
            <span>Pos</span><span>No.</span><span>Driver</span><span>Constructor</span>
            <span style={{ textAlign:'right' }}>SQ1</span><span style={{ textAlign:'right' }}>SQ2</span><span style={{ textAlign:'right' }}>SQ3</span>
          </div>
          {sprintQualifyingResults.map((r, i) => {
            const color = ctorColor(r.Constructor?.constructorId)
            const isFirst = i === 0
            // Jolpica stores SQ times under Q1/Q2/Q3 keys
            const sq1 = r.Q1 || r.SQ1
            const sq2 = r.Q2 || r.SQ2
            const sq3 = r.Q3 || r.SQ3
            return (
              <div key={r.Driver?.driverId || i} style={{ display:'grid', gridTemplateColumns:'2.5rem 1.5rem 1fr 1fr 4.5rem 4.5rem 4.5rem', gap:'0 0.75rem', padding:'0.55rem 1.25rem', alignItems:'center', borderBottom: i < sprintQualifyingResults.length-1 ? '1px solid var(--border-subtle)' : 'none', background: isFirst ? 'var(--surface-3)' : 'transparent', borderLeft: isFirst ? `3px solid ${color}` : '3px solid transparent' }}>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'1rem', fontWeight:900, color: isFirst ? color : 'var(--text-muted)' }}>{r.position}</span>
                <span style={{ fontFamily:'var(--font-condensed)', fontSize:'0.75rem', fontWeight:700, color, opacity:0.8 }}>{r.Driver?.permanentNumber || r.Driver?.code || '—'}</span>
                <div>
                  <div style={{ fontSize:'0.82rem', fontWeight: isFirst ? 700 : 500 }}>{r.Driver?.givenName} {r.Driver?.familyName}</div>
                  <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{r.Driver?.nationality}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <div style={{ width:3, height:18, borderRadius:2, background:color, flexShrink:0 }} />
                  <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{r.Constructor?.name || '—'}</span>
                </div>
                {[sq1, sq2, sq3].map((val, qi) => (
                  <span key={qi} style={{ fontSize:'0.78rem', textAlign:'right', color: val ? (isFirst && qi===2 ? color : 'var(--text-primary)') : 'var(--text-muted)', fontVariantNumeric:'tabular-nums' }}>
                    {val || '—'}
                  </span>
                ))}
              </div>
            )
          })}
        </div>}

      </Panel>
      )}

      {/* Telemetry (Cassandra) */}
      <Suspense fallback={
        <Panel accent="cassandra" style={{ marginTop: '1rem' }}>
          <EmptyState type="loading" message="Loading telemetry..." height={80} />
        </Panel>
      }>
        <RaceTelemetrySection
          season={race.season}
          raceName={race.raceName}
          circuitLocality={race.Circuit?.Location?.locality}
          isUpcoming={isUpcoming}
        />
      </Suspense>
    </PageWrapper>
    {!isMobile && <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />}
    </>
  )
}
