import { useState, useEffect, useMemo } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import ControlGroup from '../components/ui/ControlGroup'
import { telemetryApi } from '../services/api'
import { useBreakpoint } from '../hooks/useBreakpoint'
import PaceDriverSelector from '../components/pace/PaceDriverSelector'
import PaceDriverStats from '../components/pace/PaceDriverStats'
import PaceChart from '../components/pace/PaceChart'

const PALETTE = [
  '#e8002d', '#27F4D2', '#FF8000', '#3671C6',
  '#229971', '#FF87BC', '#6692FF', '#52E252',
]

function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function stdDev(arr) {
  if (arr.length < 2) return 0
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - avg) ** 2, 0) / arr.length)
}

export default function RacePacePage() {
  const { isMobile } = useBreakpoint()
  const [races,          setRaces]          = useState([])
  const [selectedRace,   setSelectedRace]   = useState('')
  const [allDrivers,     setAllDrivers]     = useState([])
  const [selectedDrivers,setSelectedDrivers]= useState([])
  const [paceData,       setPaceData]       = useState([])
  const [loading,        setLoading]        = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces()
      .then(r => { setRaces(r); if (r.length) setSelectedRace(r[0].raceId) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedRace) return
    setLoadingDrivers(true)
    setAllDrivers([])
    setSelectedDrivers([])
    setPaceData([])
    telemetryApi.getRaceDrivers(selectedRace)
      .then(d => {
        setAllDrivers(d)
        setSelectedDrivers(d.slice(0, 3).map(x => x.driverId))
      })
      .catch(() => {})
      .finally(() => setLoadingDrivers(false))
  }, [selectedRace])

  useEffect(() => {
    if (!selectedRace || !selectedDrivers.length) { setPaceData([]); return }
    setLoading(true)
    telemetryApi.getRacePace(selectedRace, selectedDrivers)
      .then(setPaceData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedRace, selectedDrivers])

  function toggleDriver(driverId) {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(d => d !== driverId)
        : prev.length >= 5 ? prev : [...prev, driverId]
    )
  }

  const { chartData, driverMeta, pitLines, scPeriods } = useMemo(() => {
    if (!paceData.length) return { chartData: [], driverMeta: [], pitLines: [], scPeriods: [] }

    const maxLap = Math.max(...paceData.map(d => d.laps.length))
    const pitLines = new Set()

    const driverMeta = paceData.map((d, i) => {
      const validTimes = d.laps.map(l => l.time).filter(t => t > 10 && t < 200)
      const med = median(validTimes)
      d.laps.forEach(l => { if (l.isPit) pitLines.add(l.lap) })
      return {
        driverId:    d.driverId,
        color:       PALETTE[i % PALETTE.length],
        acronym:     allDrivers.find(a => a.driverId === d.driverId)?.acronym || d.driverId,
        teamName:    allDrivers.find(a => a.driverId === d.driverId)?.teamName || '',
        median:      med,
        best:        Math.min(...validTimes),
        consistency: stdDev(validTimes),
        laps:        d.laps,
      }
    })

    const hiddenLaps = new Map()
    for (const d of driverMeta) {
      const hide = new Set()
      for (const l of d.laps) {
        if (l.isPit) { hide.add(l.lap); hide.add(l.lap + 1) }
        if (l.time > d.median * 1.35) hide.add(l.lap)
      }
      hiddenLaps.set(d.driverId, hide)
    }

    const chartData = Array.from({ length: maxLap }, (_, i) => {
      const lap = i + 1
      const row = { lap }
      for (const d of driverMeta) {
        const lapData = d.laps.find(l => l.lap === lap)
        if (lapData && lapData.time > 10) {
          const hide = hiddenLaps.get(d.driverId)
          row[d.driverId]          = hide.has(lap) ? null : lapData.time
          row[`${d.driverId}_raw`] = lapData.time
        }
      }
      return row
    })

    const scLapFlags = Array.from({ length: maxLap }, (_, i) => {
      const lap = i + 1
      let slowCount = 0, pitCount = 0
      for (const d of driverMeta) {
        const l = d.laps.find(x => x.lap === lap)
        if (!l || l.time <= 10) continue
        if (l.isPit) { pitCount++; continue }
        if (l.time > d.median * 1.10) slowCount++
      }
      return pitCount === 0 && slowCount >= Math.max(2, Math.ceil(driverMeta.length * 0.6))
    })
    const scPeriods = []
    let start = null
    for (let i = 0; i < scLapFlags.length; i++) {
      if (scLapFlags[i] && start === null) start = i + 1
      if (!scLapFlags[i] && start !== null) {
        if (i + 1 - start >= 2) scPeriods.push({ x1: start, x2: i })
        start = null
      }
    }
    if (start !== null && maxLap - start >= 1) scPeriods.push({ x1: start, x2: maxLap })

    return { chartData, driverMeta, pitLines: [...pitLines], scPeriods }
  }, [paceData, allDrivers])

  return (
    <PageWrapper>
      <PageHeader
        title="Race Pace Analysis"
        subtitle="Lap-by-lap time comparison · up to 5 drivers"
        actions={
          <ControlGroup label="Race" width={200}>
            <select className="input" style={{ width: 200 }} value={selectedRace} onChange={e => setSelectedRace(e.target.value)}>
              {races.map(r => <option key={r.raceId} value={r.raceId}>{r.raceName}</option>)}
            </select>
          </ControlGroup>
        }
      />

      {allDrivers.length > 0 && (
        <PaceDriverSelector
          allDrivers={allDrivers}
          selectedDrivers={selectedDrivers}
          onToggle={toggleDriver}
        />
      )}

      {loadingDrivers && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading drivers...</p>}

      <PaceDriverStats driverMeta={driverMeta} isMobile={isMobile} />

      <PaceChart
        chartData={chartData}
        driverMeta={driverMeta}
        pitLines={pitLines}
        scPeriods={scPeriods}
        loading={loading}
        isMobile={isMobile}
      />
    </PageWrapper>
  )
}
