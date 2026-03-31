import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { telemetryApi } from '../../services/api'

const GHOST_COLORS = ['#27F4D2', '#FF8000']

function fmtLapTime(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

function buildChartData(laps1, laps2, d1, d2) {
  const allLaps = new Set([...laps1.map(l => l.lap_number), ...laps2.map(l => l.lap_number)])
  const map1 = Object.fromEntries(laps1.map(l => [l.lap_number, l.lap_time > 0 && l.lap_time < 300 ? l.lap_time : null]))
  const map2 = Object.fromEntries(laps2.map(l => [l.lap_number, l.lap_time > 0 && l.lap_time < 300 ? l.lap_time : null]))
  return [...allLaps].sort((a, b) => a - b).map(lap => ({
    lap,
    [d1]: map1[lap] ?? null,
    [d2]: map2[lap] ?? null,
  }))
}

export default function GhostLapsPanel({ circuit }) {
  const [races,        setRaces]        = useState([])
  const [racesLoading, setRacesLoading] = useState(true)
  const [selectedRace, setSelectedRace] = useState(null)
  const [drivers,      setDrivers]      = useState([])
  const [driver1,      setDriver1]      = useState('')
  const [driver2,      setDriver2]      = useState('')
  const [lapData,      setLapData]      = useState(null)
  const [comparing,    setComparing]    = useState(false)
  const [error,        setError]        = useState('')

  useEffect(() => {
    setRaces([])
    setSelectedRace(null)
    setDrivers([])
    setDriver1('')
    setDriver2('')
    setLapData(null)
    setRacesLoading(true)

    telemetryApi.getAvailableRaces()
      .then(all => {
        if (!Array.isArray(all)) { setError('Unexpected response from server'); return }
        if (!all.length) { setRaces([]); return }

        const circName = (circuit.circuitName || '').toLowerCase()
        const country  = (circuit.Location?.country || circuit.country || '').toLowerCase()
        const locality = (circuit.Location?.locality || circuit.locality || '').toLowerCase()
        const keywords = [country, locality, ...circName.split(' ').filter(w => w.length > 3)]

        const matched = all.filter(r => {
          const rn = (r.raceName || '').toLowerCase()
          return keywords.some(kw => kw && rn.includes(kw))
        })
        setRaces(matched.length ? matched : all)
      })
      .catch(err => setError(err?.message || 'Could not load races'))
      .finally(() => setRacesLoading(false))
  }, [circuit.circuitId])

  useEffect(() => {
    if (!selectedRace) { setDrivers([]); setDriver1(''); setDriver2(''); return }
    telemetryApi.getRaceDrivers(selectedRace.raceId)
      .then(d => { setDrivers(d); setDriver1(''); setDriver2('') })
      .catch(() => {})
  }, [selectedRace])

  function compare() {
    if (!selectedRace || !driver1 || !driver2 || driver1 === driver2) return
    setComparing(true)
    setLapData(null)
    setError('')
    Promise.all([
      telemetryApi.getLapTimes(selectedRace.raceId, driver1),
      telemetryApi.getLapTimes(selectedRace.raceId, driver2),
    ])
      .then(([l1, l2]) => {
        if (!l1.length && !l2.length) { setError('No lap data for these drivers'); return }
        setLapData({ laps1: l1, laps2: l2 })
      })
      .catch(() => setError('Failed to load lap times'))
      .finally(() => setComparing(false))
  }

  const d1Label  = drivers.find(d => d.driverId === driver1)?.acronym || driver1
  const d2Label  = drivers.find(d => d.driverId === driver2)?.acronym || driver2
  const chartData = lapData ? buildChartData(lapData.laps1, lapData.laps2, driver1, driver2) : []

  const selectStyle = {
    background: 'rgba(22,22,22,0.92)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: 'var(--text-primary)',
    padding: '0.35rem 0.65rem', fontSize: '0.8rem', cursor: 'pointer',
    fontFamily: "'Barlow Condensed', sans-serif",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        marginTop: '0.75rem',
        background: 'rgba(22,22,22,0.92)',
        border: '1px solid rgba(0,170,255,0.2)',
        borderLeft: '3px solid #00aaff',
        borderRadius: 12,
        padding: '1rem 1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '1rem' }}>👻</span>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            Ghost Laps
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Compare driver lap times side-by-side
          </div>
        </div>
      </div>

      {/* Season pills */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Season
        </div>
        {racesLoading ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</div>
        ) : races.length === 0 && !error ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No telemetry data for this circuit</div>
        ) : (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[...new Set(races.map(r => r.raceId.split('_')[0]))]
              .sort((a, b) => b - a)
              .map(year => {
                const race  = races.find(r => r.raceId.startsWith(year + '_'))
                const isSel = selectedRace?.raceId === race?.raceId
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedRace(isSel ? null : race)}
                    style={{
                      padding: '0.3rem 0.85rem', borderRadius: 99,
                      border: `1px solid ${isSel ? 'rgba(0,170,255,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      background: isSel ? 'rgba(0,170,255,0.18)' : 'transparent',
                      color: isSel ? '#00aaff' : 'rgba(255,255,255,0.55)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {year}
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: GHOST_COLORS[0], letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Driver 1</div>
          <select
            value={driver1}
            onChange={e => setDriver1(e.target.value)}
            disabled={!drivers.length}
            style={{ ...selectStyle, minWidth: 150, borderColor: driver1 ? `${GHOST_COLORS[0]}60` : 'rgba(255,255,255,0.12)' }}
          >
            <option value="">Select driver...</option>
            {drivers.filter(d => d.driverId !== driver2).map(d => (
              <option key={d.driverId} value={d.driverId}>{d.acronym} — {d.fullName}</option>
            ))}
          </select>
        </div>

        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)', paddingBottom: '0.15rem' }}>VS</div>

        <div>
          <div style={{ fontSize: '0.6rem', color: GHOST_COLORS[1], letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Driver 2</div>
          <select
            value={driver2}
            onChange={e => setDriver2(e.target.value)}
            disabled={!drivers.length}
            style={{ ...selectStyle, minWidth: 150, borderColor: driver2 ? `${GHOST_COLORS[1]}60` : 'rgba(255,255,255,0.12)' }}
          >
            <option value="">Select driver...</option>
            {drivers.filter(d => d.driverId !== driver1).map(d => (
              <option key={d.driverId} value={d.driverId}>{d.acronym} — {d.fullName}</option>
            ))}
          </select>
        </div>

        <button
          onClick={compare}
          disabled={!selectedRace || !driver1 || !driver2 || driver1 === driver2 || comparing}
          style={{
            padding: '0.38rem 1.1rem', borderRadius: 6,
            background: (!selectedRace || !driver1 || !driver2) ? 'rgba(255,255,255,0.06)' : 'rgba(0,170,255,0.18)',
            border: `1px solid ${(!selectedRace || !driver1 || !driver2) ? 'rgba(255,255,255,0.12)' : 'rgba(0,170,255,0.4)'}`,
            color: (!selectedRace || !driver1 || !driver2) ? 'rgba(255,255,255,0.3)' : '#00aaff',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {comparing ? 'Loading...' : 'Compare →'}
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '0.75rem', padding: '0.6rem 0.85rem',
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 7, fontSize: '0.78rem', color: '#f87171',
        }}>
          <strong>Telemetry unavailable:</strong> {error}
        </div>
      )}

      {chartData.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.6rem' }}>
            {[{ id: driver1, label: d1Label, color: GHOST_COLORS[0] }, { id: driver2, label: d2Label, color: GHOST_COLORS[1] }].map(d => {
              const laps  = d.id === driver1 ? lapData.laps1 : lapData.laps2
              const clean = laps.filter(l => l.lap_time > 0 && l.lap_time < 300)
              const best  = clean.length ? Math.min(...clean.map(l => l.lap_time)) : null
              const avg   = clean.length ? clean.reduce((s, l) => s + l.lap_time, 0) / clean.length : null
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 16, height: 3, borderRadius: 2, background: d.color }} />
                  <div>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: d.color }}>
                      {d.label}
                    </span>
                    {best && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        best {fmtLapTime(best)} · avg {fmtLapTime(avg)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <XAxis
                dataKey="lap"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{ value: 'Lap', position: 'insideBottomRight', offset: -5, fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtLapTime}
                width={58}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: 'rgba(16,16,16,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: '0.8rem' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}
                labelFormatter={v => `Lap ${v}`}
                formatter={(value, name) => [fmtLapTime(value), name === driver1 ? d1Label : d2Label]}
              />
              <Line type="monotone" dataKey={driver1} stroke={GHOST_COLORS[0]} strokeWidth={2} dot={false} connectNulls={false} activeDot={{ r: 4, fill: GHOST_COLORS[0] }} />
              <Line type="monotone" dataKey={driver2} stroke={GHOST_COLORS[1]} strokeWidth={2} dot={false} connectNulls={false} activeDot={{ r: 4, fill: GHOST_COLORS[1] }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!racesLoading && !error && races.length === 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          No telemetry data available for this circuit.
        </div>
      )}
    </motion.div>
  )
}
