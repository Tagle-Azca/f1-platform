import { useState, useEffect, useMemo, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { telemetryApi } from '../../services/api'
import { DRIVER_PALETTE } from './raceTelemetryConstants'
import PositionTooltip from './PositionTooltip'

export default function PositionTab({ raceId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const driverMetaRef = useRef([])

  useEffect(() => {
    setLoading(true)
    telemetryApi.getRacePositions(raceId)
      .then(setData).catch(()=>setData(null)).finally(()=>setLoading(false))
  }, [raceId])

  const { chartData, driverMeta, activeDrivers } = useMemo(() => {
    if (!data?.drivers?.length) return { chartData:[], driverMeta:[], activeDrivers:[] }
    const driverMeta = data.drivers.map((d, i) => ({
      ...d,
      color: d.dns ? 'var(--text-muted)' : DRIVER_PALETTE[i % DRIVER_PALETTE.length],
      pitLapSet: new Set(d.pitLaps),
    }))
    const activeDrivers = driverMeta.filter(d => !d.dns)
    return { chartData: data.laps, driverMeta, activeDrivers }
  }, [data])

  driverMetaRef.current = driverMeta

  if (loading) return (
    <div style={{ height:380, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Building position chart...</span>
    </div>
  )
  if (!chartData.length) return (
    <div style={{ height:380, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>No position data available</span>
    </div>
  )

  const totalLaps   = data?.totalLaps || 0
  const dnfDrivers  = driverMeta.filter(d => d.dnf)
  const dnsDrivers  = driverMeta.filter(d => d.dns)
  const activeCount = activeDrivers.length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', letterSpacing:'0.06em' }}>
        POSITION CHANGES · {activeCount} DRIVERS · {totalLaps} LAPS
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top:8, right:48, left:8, bottom:8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey="lap"
            tick={{ fill:'rgba(255,255,255,0.5)', fontSize:10 }}
            tickLine={false}
            axisLine={{ stroke:'rgba(255,255,255,0.14)' }}
            label={{ value:'Lap', position:'insideBottomRight', offset:-4, fill:'rgba(255,255,255,0.4)', fontSize:10 }}
          />
          <YAxis
            reversed
            domain={[1, activeCount + 1]}
            ticks={[1,3,5,7,9,11,13,15,17,19,21].filter(n => n <= activeCount)}
            tickFormatter={v => `P${v}`}
            tick={{ fill:'rgba(255,255,255,0.5)', fontSize:10 }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <Tooltip
            content={<PositionTooltip driverMetaRef={driverMetaRef} />}
            cursor={{ stroke:'rgba(255,255,255,0.12)', strokeWidth:1 }}
            wrapperStyle={{ zIndex:9999 }}
          />
          {activeDrivers.flatMap(d => [...d.pitLapSet].map(lap => (
            <ReferenceLine key={`${d.driverId}-${lap}`} x={lap}
              stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          )))}
          {activeDrivers.map(d => (
            <Line
              key={d.driverId}
              type="monotone"
              dataKey={d.driverId}
              name={d.acronym}
              stroke={d.color}
              strokeWidth={d.dnf ? 1 : 1.5}
              strokeOpacity={d.dnf ? 0.55 : 1}
              dot={false}
              activeDot={{ r:4, strokeWidth:0, fill:d.color }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem 0.75rem' }}>
        {activeDrivers.filter(d => !d.dnf).map(d => (
          <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <div style={{ width:16, height:2.5, borderRadius:2, background:d.color }} />
            <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>
              {d.acronym}
            </span>
          </div>
        ))}
        {dnfDrivers.map(d => (
          <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.35rem', opacity:0.6 }}
            title={`DNF — retired on lap ${d.lastLap}`}>
            <div style={{ width:16, height:2.5, borderRadius:2, background:d.color, opacity:0.55 }} />
            <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, textDecoration:'line-through' }}>
              {d.acronym}
            </span>
            <span style={{ fontSize:'0.58rem', color:'#f59e0b', fontWeight:700 }}>L{d.lastLap}</span>
          </div>
        ))}
        {dnsDrivers.map(d => (
          <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.35rem', opacity:0.4 }}
            title="DNS — Did Not Start">
            <div style={{ width:16, height:2.5, borderRadius:2, background:'var(--text-muted)' }} />
            <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>
              {d.acronym}
            </span>
            <span style={{ fontSize:'0.58rem', color:'var(--text-muted)', fontWeight:700 }}>DNS</span>
          </div>
        ))}
      </div>
    </div>
  )
}
