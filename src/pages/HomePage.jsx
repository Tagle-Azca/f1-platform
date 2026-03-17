import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import Panel from '../components/ui/Panel'
import EmptyState from '../components/ui/EmptyState'
import ResultRow from '../components/ui/ResultRow'
import TabBar from '../components/ui/TabBar'
import DriverDrawer from '../components/ui/DriverDrawer'
import ConstructorDrawer from '../components/ui/ConstructorDrawer'
import { dashboardApi } from '../services/api'
import { ctorColor } from '../utils/teamColors'
import NextRaceBanner from '../components/home/NextRaceBanner'
import LiveRacePanel from '../components/home/LiveRacePanel'
import LastSessionPanel from '../components/home/LastSessionPanel'

const DB_CARDS = [
  {
    db: 'mongo', name: 'MongoDB', color: '#22c55e',
    glow: 'rgba(34,197,94,0.12)', ring: 'rgba(34,197,94,0.22)',
    title: 'Season at a Glance',
    subtitle: 'Standings · Races · Circuits',
    links: [
      { to: '/races',        label: 'Races' },
      { to: '/standings',    label: 'Driver Championship' },
      { to: '/constructor-standings', label: 'Constructors' },
      { to: '/circuits',     label: 'Circuits Map' },
    ],
  },
  {
    db: 'cassandra', name: 'Cassandra', color: '#a855f7',
    glow: 'rgba(168,85,247,0.12)', ring: 'rgba(168,85,247,0.22)',
    title: 'Driver Spotlight',
    subtitle: 'Telemetry · Pace · Tire Strategy',
    links: [
      { to: '/telemetry',     label: 'Telemetry' },
      { to: '/race-pace',     label: 'Race Pace' },
      { to: '/tire-strategy', label: 'Tire Strategy' },
    ],
  },
  {
    db: 'dgraph', name: 'Dgraph', color: '#ef4444',
    glow: 'rgba(239,68,68,0.12)', ring: 'rgba(239,68,68,0.22)',
    title: 'Season Records',
    subtitle: 'Networks · Careers · Connections',
    links: [
      { to: '/graph',     label: 'Graph Explorer' },
      { to: '/teammates', label: 'Teammate History' },
    ],
  },
]

function CardBody({ db, data }) {
  const statBox = (label, value, color) => (
    <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '0.3rem 0.5rem' }}>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{value ?? '—'}</div>
    </div>
  )

  if (!data) {
    return <div style={{ height: 72, display: 'flex', alignItems: 'center' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading…</div>
    </div>
  }

  const leader  = data.standings?.[0]
  const p2      = data.standings?.[1]
  const wcc     = data.constructorStandings?.[0]
  const gap     = (leader && p2) ? leader.points - p2.points : null
  const pct     = data.totalRounds ? Math.round((data.roundsDone / data.totalRounds) * 100) : 0

  // ── Card 1: Season at a Glance ───────────────────────
  if (db === 'mongo') {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Season Progress</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{data.roundsDone}/{data.totalRounds} races</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginBottom: '0.75rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#22c55e,#86efac)', borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
        {leader && (
          <div style={{ marginBottom: '0.45rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>WDC Leader</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif" }}>{leader.name}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{leader.points} pts</span>
            </div>
            {gap !== null && (
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 1 }}>+{gap} pts ahead of P2</div>
            )}
          </div>
        )}
        {wcc && (
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>WCC Leader</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{wcc.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#22c55e', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{wcc.points} pts</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Card 2: Driver Spotlight ─────────────────────────
  if (db === 'cassandra') {
    const fl = data.lastSession?.fastestLap
    return (
      <div style={{ marginBottom: '1rem' }}>
        {leader && (
          <>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Championship Leader</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
              {leader.name}
              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{leader.team}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem', marginBottom: fl ? '0.6rem' : 0 }}>
              {statBox('Points', leader.points, '#a855f7')}
              {statBox('Wins', leader.wins, '#a855f7')}
              {statBox('Gap to P2', gap !== null ? `+${gap}` : '—')}
            </div>
          </>
        )}
        {fl && (
          <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 5, padding: '0.4rem 0.55rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Last Fastest Lap</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{fl.driver}</div>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#a855f7', fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" }}>{fl.time}</div>
          </div>
        )}
      </div>
    )
  }

  // ── Card 3: Season Records ───────────────────────────
  const fl = data.lastSession?.fastestLap
  const rows = [
    leader && { label: 'Most Wins',        value: `${leader.name} · ${leader.wins ?? 0}W` },
    wcc    && { label: 'Constructors Lead', value: wcc.name },
    fl     && { label: 'Last Fastest Lap',  value: fl.time, accent: '#ef4444', mono: true },
    data.roundsDone != null && { label: 'Races Completed', value: `${data.roundsDone} of ${data.totalRounds}` },
  ].filter(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Season Highlights</div>
      {rows.map(({ label, value, accent, mono }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700, color: accent || 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums', textAlign: 'right',
            fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
          }}>{value}</span>
        </div>
      ))}
    </div>
  )
}


const STANDINGS_TABS = [{ id: 'drivers', label: 'Drivers' }, { id: 'constructors', label: 'Constructors' }]


export default function HomePage() {
  const { isMobile, isTablet } = useBreakpoint()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [standingsTab, setStandingsTab] = useState('drivers')
  const [liveData, setLiveData] = useState(null)
  const [selectedDriver,      setSelectedDriver]      = useState(null) // { driverId, name }
  const [selectedConstructor, setSelectedConstructor] = useState(null) // { constructorId, name }

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  // Poll live race data every 5 seconds
  useEffect(() => {
    let cancelled = false
    const poll = () => {
      dashboardApi.getLive()
        .then(d => { if (!cancelled) setLiveData((d?.isLive || d?.finished) ? d : null) })
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <>
    <PageWrapper>

      {/* ── Next Race Banner ─────────────────────────────── */}
      {!loading && data?.nextRace && (
        <NextRaceBanner race={data.nextRace} totalRounds={data.totalRounds} />
      )}

      {/* ── Hero ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ textAlign: 'center', marginBottom: '3.5rem' }} 
      >
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(2.8rem, 7vw, 4.5rem)', 
          fontWeight: 900, 
          letterSpacing: '0.08em', 
          textTransform: 'uppercase', 
          lineHeight: 1,
          marginBottom: '0.5rem', 
          background: 'linear-gradient(to bottom, #fff 60%, #999)', 
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          PITWALL INTELLIGENCE
        </h1>
        
        <p style={{ 
          fontFamily: "'JetBrains Mono', monospace", 
          fontSize: '0.85rem', 
          color: 'rgba(255, 255, 255, 0.5)', 
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          maxWidth: '600px', 
          margin: '0 auto',
          fontWeight: 400
        }}>
          Decades of Speed // Milliseconds of Precision
        </p>
      </motion.div>

      {/* ── Main Grid: standings + last race ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: '1rem', marginBottom: '1rem' }}>

        {/* Championship Standings — tabbed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <Panel accent="mongo" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            {/* Header + tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <TabBar
                tabs={STANDINGS_TABS}
                activeTab={standingsTab}
                onChange={setStandingsTab}
                variant="pill"
                accentColor="var(--mongo-color)"
              />
              {data && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {data.roundsDone}/{data.totalRounds} rds
                </span>
              )}
            </div>

            {loading ? (
              <EmptyState type="loading" height={80} />
            ) : standingsTab === 'drivers' ? (
              !data?.standings?.length ? (
                <EmptyState type="empty" message="No data yet" height={80} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.standings.map((driver, i) => (
                    <ResultRow
                      key={driver.driverId}
                      position={driver.position}
                      name={driver.name}
                      sub={driver.team}
                      stat={driver.points}
                      color={ctorColor(driver.constructorId)}
                      isLeader={i === 0}
                      onClick={() => setSelectedDriver({ driverId: driver.driverId, name: driver.name })}
                    />
                  ))}
                </div>
              )
            ) : (
              !data?.constructorStandings?.length ? (
                <EmptyState type="empty" message="No data yet" height={80} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.constructorStandings.map((ctor, i) => (
                    <ResultRow
                      key={ctor.constructorId}
                      position={ctor.position}
                      name={ctor.name}
                      stat={ctor.points}
                      color={ctorColor(ctor.constructorId)}
                      isLeader={i === 0}
                      onClick={() => setSelectedConstructor({ constructorId: ctor.constructorId, name: ctor.name })}
                    />
                  ))}
                </div>
              )
            )}

            <Link
              to={standingsTab === 'drivers' ? '/standings' : '/constructor-standings'}
              style={{
                alignSelf: 'flex-end', fontSize: '0.75rem', color: '#22c55e',
                textDecoration: 'none', letterSpacing: '0.06em', fontWeight: 600,
                fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase',
              }}
            >
              Full standings →
            </Link>
          </Panel>
        </motion.div>

        {/* Last Session / Live Race */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {liveData ? <LiveRacePanel live={liveData} /> : (
            <LastSessionPanel session={data?.lastSession} loading={loading} />
          )}
        </motion.div>
      </div>

      {/* ── DB Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
        {DB_CARDS.map(({ db, name, color, glow, ring, title, subtitle, links }, i) => (
          <motion.div
            key={db}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
            whileHover={{ y: -2, boxShadow: `0 8px 28px ${glow}` }}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <Panel accent={db} style={{ height: '100%', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 100,
                background: `radial-gradient(ellipse at 50% 0%, ${glow} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.04em',
                    textTransform: 'uppercase', color,
                    lineHeight: 1.15,
                  }}>
                    {title}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginTop: 3 }}>
                    {subtitle}
                  </div>
                </div>
                <CardBody db={db} data={data} />
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {links.map(({ to, label }) => (
                    <Link
                      key={to} to={to}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 6, border: `1px solid ${ring}`,
                        background: glow, color,
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '0.78rem', fontWeight: 700,
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        textDecoration: 'none', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = glow.replace('0.12', '0.22')
                        e.currentTarget.style.borderColor = color
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = glow
                        e.currentTarget.style.borderColor = ring
                      }}
                    >
                      {label} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Panel>
          </motion.div>
        ))}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Data sourced from Jolpica F1 API · OpenF1 · 1950 – {new Date().getFullYear()}
      </p>

    </PageWrapper>

    <DriverDrawer driver={selectedDriver} onClose={() => setSelectedDriver(null)} />
    <ConstructorDrawer constructor={selectedConstructor} onClose={() => setSelectedConstructor(null)} />
</>
  )
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255'
}
