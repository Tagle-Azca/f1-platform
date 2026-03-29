import { useState, useEffect } from 'react'
import { telemetryApi } from '../../services/api'
import { normalizeName } from './raceTelemetryConstants'
import PositionTab from './PositionTab'
import PaceTab from './PaceTab'
import TiresTab from './TiresTab'

const TABS = [
  { id:'positions', label:'Position Chart' },
  { id:'pace',      label:'Race Pace' },
  { id:'tires',     label:'Tire Strategy' },
]

export default function RaceTelemetrySection({ season, raceName, circuitLocality, isUpcoming }) {
  const [tab,        setTab]        = useState('positions')
  const [raceId,     setRaceId]     = useState(null)
  const [allDrivers, setAllDrivers] = useState([])
  const [noData,     setNoData]     = useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces().then(races => {
      const local = normalizeName(circuitLocality || '')
      const rName = normalizeName(raceName || '')

      let match = races.find(r => {
        const [y] = r.raceId.split('_')
        if (y !== season) return false
        const cn = normalizeName(r.raceName || '')
        return cn && local && (cn.includes(local.slice(0,5)) || local.includes(cn.slice(0,5)))
      })

      if (!match) {
        match = races.find(r => {
          const [y] = r.raceId.split('_')
          if (y !== season) return false
          const cn = normalizeName(r.raceName || '')
          return cn && rName && (cn.includes(rName.slice(0,5)) || rName.includes(cn.slice(0,5)))
        })
      }

      if (match) setRaceId(match.raceId)
      else setNoData(true)
    }).catch(() => setNoData(true))
  }, [season, raceName, circuitLocality])

  useEffect(() => {
    if (!raceId) return
    telemetryApi.getRaceDrivers(raceId).then(setAllDrivers).catch(()=>{})
  }, [raceId])

  return (
    <div style={{
      background:'rgba(22,22,22,0.9)',
      border:'1px solid rgba(255,255,255,0.13)',
      borderTop:'2px solid #a855f7',
      borderRadius:12, overflow:'hidden',
      marginTop:'1rem',
    }}>
      <div style={{
        padding:'0.85rem 1.25rem',
        borderBottom:'1px solid rgba(255,255,255,0.11)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap',
        background:'rgba(168,85,247,0.1)',
      }}>
        <div style={{ display:'flex', gap:'0.2rem', background:'rgba(255,255,255,0.09)', borderRadius:8, padding:'0.18rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'0.28rem 1rem', borderRadius:6, border:'none', cursor:'pointer',
              fontFamily:"'Barlow Condensed', sans-serif", fontSize:'0.72rem', fontWeight:700,
              letterSpacing:'0.08em', textTransform:'uppercase',
              background: tab===t.id ? 'rgba(168,85,247,0.2)' : 'transparent',
              color: tab===t.id ? '#a855f7' : 'var(--text-secondary)',
              transition:'all 0.15s',
              boxShadow: tab===t.id ? '0 0 12px rgba(168,85,247,0.15)' : 'none',
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <span className="db-badge db-badge--cassandra">Cassandra</span>
      </div>

      <div style={{ padding:'1rem 1.25rem' }}>
        {isUpcoming ? (
          <div style={{ height:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="rgba(168,85,247,0.5)" style={{ width:28, height:28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)' }}>
              Post-Race Telemetry: Full data synchronization is processed 24 hours after the checkered flag
            </span>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
              Live telemetry, pit-window analysis, and compound strategy: Awaiting green flag.
            </span>
          </div>
        ) : noData ? (
          <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
              Telemetry Data: Compatible with 2023+ Sessions. Historical results active.
            </span>
          </div>
        ) : !raceId ? (
          <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>Matching telemetry data...</span>
          </div>
        ) : tab==='positions' ? (
          <PositionTab raceId={raceId} allDrivers={allDrivers} />
        ) : tab==='pace' ? (
          <PaceTab raceId={raceId} allDrivers={allDrivers} />
        ) : (
          <TiresTab raceId={raceId} />
        )}
      </div>
    </div>
  )
}
