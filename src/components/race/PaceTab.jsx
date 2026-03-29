import { useState, useEffect, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ResponsiveContainer,
} from 'recharts'
import { telemetryApi } from '../../services/api'
import { DRIVER_PALETTE, formatTime, median, stdDev } from './raceTelemetryConstants'
import ChartTooltip from './ChartTooltip'

export default function PaceTab({ raceId, allDrivers }) {
  const [selected, setSelected] = useState([])
  const [paceData, setPaceData] = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (allDrivers.length) setSelected(allDrivers.slice(0,3).map(d=>d.driverId))
  }, [allDrivers])

  useEffect(() => {
    if (!raceId || !selected.length) { setPaceData([]); return }
    setLoading(true)
    telemetryApi.getRacePace(raceId, selected)
      .then(setPaceData).catch(()=>{}).finally(()=>setLoading(false))
  }, [raceId, selected])

  function toggle(id) {
    setSelected(p => p.includes(id) ? p.filter(d=>d!==id) : p.length>=5 ? p : [...p,id])
  }

  const { chartData, driverMeta, scPeriods } = useMemo(() => {
    if (!paceData.length) return { chartData:[], driverMeta:[], scPeriods:[] }
    const meta = paceData.map((d,i) => {
      const valid = d.laps.map(l=>l.time).filter(t=>t>10&&t<200)
      const med = median(valid)
      return {
        driverId: d.driverId,
        color:    DRIVER_PALETTE[i % DRIVER_PALETTE.length],
        acronym:  allDrivers.find(a=>a.driverId===d.driverId)?.acronym || d.driverId,
        teamName: allDrivers.find(a=>a.driverId===d.driverId)?.teamName || '',
        median:   med, best:Math.min(...valid), consistency:stdDev(valid), laps:d.laps,
      }
    })
    const maxLap = Math.max(...paceData.map(d=>d.laps.length))

    const hiddenLaps = new Map()
    for (const d of meta) {
      const hide = new Set()
      for (const l of d.laps) {
        if (l.isPit) { hide.add(l.lap); hide.add(l.lap + 1) }
        if (l.time > d.median * 1.35) hide.add(l.lap)
      }
      hiddenLaps.set(d.driverId, hide)
    }

    const chartData = Array.from({length:maxLap},(_,i)=>{
      const lap=i+1, row={lap}
      for (const d of meta) {
        const l = d.laps.find(x=>x.lap===lap)
        if (l && l.time>10) {
          const hide = hiddenLaps.get(d.driverId)
          row[d.driverId]          = hide.has(lap) ? null : l.time
          row[`pit_${d.driverId}`] = l.isPit ? l.time : null
        }
      }
      return row
    })

    const scLapFlags = Array.from({length:maxLap}, (_,i) => {
      const lap = i + 1
      let slowCount = 0, pitCount = 0
      for (const d of meta) {
        const l = d.laps.find(x => x.lap === lap)
        if (!l || l.time <= 10) continue
        if (l.isPit) { pitCount++; continue }
        if (l.time > d.median * 1.10) slowCount++
      }
      return pitCount === 0 && slowCount >= Math.max(2, Math.ceil(meta.length * 0.6))
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

    return { chartData, driverMeta:meta, scPeriods }
  }, [paceData, allDrivers])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      {allDrivers.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', alignItems:'center' }}>
          <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.07em', marginRight:'0.25rem' }}>
            MAX 5
          </span>
          {allDrivers.map(d => {
            const isSel = selected.includes(d.driverId)
            const color = isSel ? DRIVER_PALETTE[selected.indexOf(d.driverId) % DRIVER_PALETTE.length] : undefined
            return (
              <button key={d.driverId} onClick={()=>toggle(d.driverId)} style={{
                padding:'0.22rem 0.6rem', borderRadius:99, cursor:'pointer',
                fontFamily:"'Barlow Condensed', sans-serif", fontSize:'0.72rem', fontWeight:700,
                border:`1px solid ${isSel ? color : 'rgba(255,255,255,0.1)'}`,
                background: isSel ? `${color}22` : 'transparent',
                color: isSel ? color : 'var(--text-muted)', transition:'all 0.15s',
              }}>
                {d.acronym}
              </button>
            )
          })}
        </div>
      )}

      {driverMeta.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${driverMeta.length},1fr)`, gap:'0.45rem' }}>
          {driverMeta.map(d => (
            <div key={d.driverId} style={{
              background:'rgba(22,22,22,0.9)', border:`1px solid rgba(255,255,255,0.13)`,
              borderTop:`2px solid ${d.color}`, borderRadius:8, padding:'0.6rem 0.8rem',
            }}>
              <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:'0.9rem', fontWeight:900, color:d.color, marginBottom:'0.35rem' }}>
                {d.acronym}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.25rem 0.4rem' }}>
                {[
                  { l:'Best',   v:formatTime(d.best) },
                  { l:'Median', v:formatTime(d.median) },
                  { l:'±',      v:`${d.consistency.toFixed(2)}s` },
                  { l:'Laps',   v:d.laps.length },
                ].map(({l,v}) => (
                  <div key={l}>
                    <div style={{ fontSize:'0.5rem', color:'var(--text-muted)', letterSpacing:'0.07em', textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-primary)', fontVariantNumeric:'tabular-nums' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'rgba(22,22,22,0.9)', border:'1px solid rgba(255,255,255,0.11)', borderRadius:8, padding:'1rem' }}>
        {loading ? (
          <div style={{ height:320, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Loading pace data...</span>
          </div>
        ) : !chartData.length ? (
          <div style={{ height:320, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Select drivers above</span>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top:8, right:12, left:6, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                <XAxis dataKey="lap" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:10 }} tickLine={false} axisLine={{ stroke:'rgba(255,255,255,0.14)' }} />
                <YAxis reversed tickFormatter={formatTime} tick={{ fill:'rgba(255,255,255,0.5)', fontSize:10 }} tickLine={false} axisLine={false} width={50} domain={['auto','auto']} />
                <Tooltip content={<ChartTooltip formatter={formatTime} />} cursor={{ stroke:'rgba(255,255,255,0.08)', strokeWidth:1 }} wrapperStyle={{ zIndex:9999 }} />
                {scPeriods.map(({ x1, x2 }) => (
                  <ReferenceArea key={`sc-${x1}`} x1={x1} x2={x2}
                    fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.25)" strokeWidth={1}
                    label={{ value:'SC/VSC', position:'insideTop', fill:'rgba(245,158,11,0.7)', fontSize:8, fontWeight:700 }}
                  />
                ))}
                {driverMeta.map(d => (
                  <Line key={d.driverId} type="monotone" dataKey={d.driverId} name={d.acronym}
                    stroke={d.color} strokeWidth={2} dot={false}
                    activeDot={{ r:4, strokeWidth:0, fill:d.color }}
                    connectNulls isAnimationActive={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {driverMeta.some(d => chartData.some(r => r[`pit_${d.driverId}`] != null)) && (
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.11)', paddingTop:'0.6rem', marginTop:'0.25rem' }}>
                <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', letterSpacing:'0.08em', fontWeight:700, marginBottom:'0.4rem' }}>
                  PIT STOPS
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  {driverMeta.map(d => {
                    const pitLaps = chartData.filter(r => r[`pit_${d.driverId}`] != null).map(r => r.lap)
                    if (!pitLaps.length) return null
                    return (
                      <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <span style={{ width:36, fontSize:'0.72rem', fontWeight:700, color:d.color, fontFamily:"'Barlow Condensed', sans-serif", flexShrink:0 }}>
                          {d.acronym}
                        </span>
                        <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>
                          {pitLaps.map((lap, i) => (
                            <span key={lap} style={{
                              background:`${d.color}18`, border:`1px solid ${d.color}55`,
                              color:d.color, borderRadius:4, padding:'1px 7px',
                              fontSize:'0.65rem', fontWeight:700, fontVariantNumeric:'tabular-nums',
                            }}>
                              Lap {lap} {pitLaps.length > 1 ? `(Stop ${i+1})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
