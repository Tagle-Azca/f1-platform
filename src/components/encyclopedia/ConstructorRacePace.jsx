import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts'
import { telemetryApi } from '../../services/api'
import EmptyState from '../ui/EmptyState'

const COMPOUND_COLOR = { SOFT: '#ef4444', MEDIUM: '#eab308', HARD: '#d1d5db', INTERMEDIATE: '#22c55e', WET: '#3b82f6' }

function fmtLap(s) {
  if (s == null) return '—'
  const m   = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec.toFixed(3)}`
}

function PaceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.6rem 0.85rem', fontSize: '0.72rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Lap {label}</div>
      {payload.map(p => {
        const compound = p.payload[`${p.dataKey}_compound`]
        return (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{p.dataKey}:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{fmtLap(p.value)}</span>
            {compound && (
              <span style={{ padding: '1px 5px', borderRadius: 3, background: `${COMPOUND_COLOR[compound]}22`, color: COMPOUND_COLOR[compound], fontWeight: 700, fontSize: '0.6rem' }}>
                {compound[0]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ConstructorRacePace({ teamName, year, color }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [selectedId, setSelectedId] = useState(null)

  // Fetch when team/year changes — reset selection
  useEffect(() => {
    setLoading(true); setData(null); setSelectedId(null)
    telemetryApi.getTeamPace(teamName, year)
      .then(d => { setData(d); setSelectedId(d?.raceId ?? null) })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [teamName, year])

  // Fetch when user picks a different race
  function handleRaceSelect(raceId) {
    if (raceId === selectedId) return
    setSelectedId(raceId)
    setLoading(true)
    telemetryApi.getTeamPace(teamName, year, raceId)
      .then(setData).catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  if (loading) return <EmptyState type="loading" height={180} />
  if (!data?.drivers?.length) return <EmptyState type="empty" message="No telemetry data for this team" height={120} />

  const [dA, dB] = data.drivers
  const colorA = color
  const colorB = `${color}88`

  const lapMap = new Map()
  for (const lap of dA.laps) {
    lapMap.set(lap.lap, { lap: lap.lap, [dA.acronym]: lap.time, [`${dA.acronym}_compound`]: lap.compound })
  }
  if (dB) {
    for (const lap of dB.laps) {
      const existing = lapMap.get(lap.lap) || { lap: lap.lap }
      existing[dB.acronym] = lap.time
      existing[`${dB.acronym}_compound`] = lap.compound
      lapMap.set(lap.lap, existing)
    }
  }
  const chartData = [...lapMap.values()].sort((a, b) => a.lap - b.lap)

  const allTimes = chartData.flatMap(d => [d[dA.acronym], dB && d[dB.acronym]]).filter(Boolean)
  const minTime  = Math.floor(Math.min(...allTimes) - 1)
  const maxTime  = Math.ceil(Math.max(...allTimes) + 1)

  const available = data.availableRaces || []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Race Pace · {data.raceName}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Lap times — pit laps excluded from trend
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[dA, dB].filter(Boolean).map((d, i) => (
            <div key={d.driverId} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 18, height: 2, background: i === 0 ? colorA : colorB, borderRadius: 1 }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.acronym}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 18, height: 1, background: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Field avg</span>
          </div>
        </div>
      </div>

      {/* Race selector — only shown when multiple races are available */}
      {available.length > 1 && (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {available.map(r => {
            const shortName = r.raceName.replace(' Grand Prix', '').replace(' GP', '')
            const active    = r.raceId === selectedId
            return (
              <button
                key={r.raceId}
                onClick={() => handleRaceSelect(r.raceId)}
                style={{
                  fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  background: active ? color : 'rgba(255,255,255,0.06)',
                  color:      active ? '#000' : 'var(--text-muted)',
                }}
              >
                {shortName}
              </button>
            )
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="lap" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis domain={[minTime, maxTime]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={fmtLap} width={52} />
          <Tooltip content={<PaceTooltip />} />
          {data.fieldAvgLap && (
            <ReferenceLine y={data.fieldAvgLap} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4"
              label={{ value: `Field ${fmtLap(data.fieldAvgLap)}`, position: 'insideTopRight', fontSize: 9, fill: 'rgba(255,255,255,0.35)' }}
            />
          )}
          <Line dataKey={dA.acronym} stroke={colorA} strokeWidth={1.5} dot={false} connectNulls={false} />
          {dB && <Line dataKey={dB.acronym} stroke={colorB} strokeWidth={1.5} dot={false} strokeDasharray="4 3" connectNulls={false} />}
        </LineChart>
      </ResponsiveContainer>

      {/* Sector Dominance */}
      {data.sectorDominance && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Sector Dominance vs Field
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {data.sectorDominance.map(s => {
              const faster = s.delta < 0
              const diff   = Math.abs(s.delta)
              return (
                <div key={s.sector} style={{ flex: 1, background: faster ? `${color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${faster ? color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{s.sector}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: faster ? color : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {faster ? '−' : '+'}{diff.toFixed(3)}s
                  </div>
                  <div style={{ fontSize: '0.55rem', color: faster ? color : 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {faster ? '▲ Faster' : '▼ Slower'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
