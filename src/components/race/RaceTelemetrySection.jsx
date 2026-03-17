import { useState, useEffect, useMemo, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer, Legend,
} from 'recharts'
import { telemetryApi } from '../../services/api'

// ── Palettes & constants ──────────────────────────────────
const DRIVER_PALETTE = [
  '#e8002d','#27F4D2','#FF8000','#3671C6','#229971',
  '#FF87BC','#6692FF','#52E252','#f59e0b','#a855f7',
  '#06b6d4','#84cc16','#f97316','#ec4899','#14b8a6',
  '#8b5cf6','#ef4444','#10b981','#3b82f6','#fbbf24',
  '#6366f1','#d946ef',
]

const COMPOUND_COLOR = {
  SOFT:         { bg: '#e8002d', label: '#fff' },
  MEDIUM:       { bg: '#ffd600', label: '#111' },
  HARD:         { bg: '#e0e0e0', label: '#111' },
  INTERMEDIATE: { bg: '#39b54a', label: '#fff' },
  WET:          { bg: '#0067ff', label: '#fff' },
  UNKNOWN:      { bg: 'repeating-linear-gradient(45deg,#444 0px,#444 4px,#2a2a2a 4px,#2a2a2a 8px)', label: 'rgba(255,255,255,0.55)' },
}
const COMPOUND_ABBR = { SOFT:'S', MEDIUM:'M', HARD:'H', INTERMEDIATE:'I', WET:'W', UNKNOWN:'?' }

function compound(raw = '') {
  const k = raw.toUpperCase()
  return COMPOUND_COLOR[k] ? k : 'UNKNOWN'
}

function normalizeName(name = '') {
  return name.toLowerCase().replace(/grand prix/gi,'').replace(/[^a-z0-9]/g,'').trim()
}

function formatTime(secs) {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}
function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a,b)=>a-b), m = Math.floor(s.length/2)
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2
}
function stdDev(arr) {
  if (arr.length<2) return 0
  const avg=arr.reduce((a,b)=>a+b,0)/arr.length
  return Math.sqrt(arr.reduce((s,v)=>s+(v-avg)**2,0)/arr.length)
}

// ── Shared tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'rgba(8,8,8,0.97)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'0.6rem 0.85rem', minWidth:150 }}>
      <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:5 }}>Lap {label}</p>
      {[...payload].sort((a,b)=>a.value-b.value).map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.8)', flex:1 }}>{p.name}</span>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:p.color, fontVariantNumeric:'tabular-nums' }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Position tooltip (aware of DNF/DNS) ───────────────────
function PositionTooltip({ active, payload, label, driverMetaRef }) {
  if (!active) return null
  const lap = label
  const meta = driverMetaRef.current || []

  // Drivers with data at this lap (from payload)
  const presentSet = new Set(payload?.map(p => p.dataKey) || [])
  const present = (payload || []).slice().sort((a, b) => a.value - b.value)

  // Drivers that have retired before this lap
  const retired = meta.filter(d =>
    !d.dns && !presentSet.has(d.driverId) && d.lastLap != null && d.lastLap < lap
  )

  // DNS drivers (never had data)
  const dns = meta.filter(d => d.dns)

  if (!present.length && !retired.length && !dns.length) return null

  return (
    <div style={{ background:'rgba(8,8,8,0.97)', border:'1px solid var(--border-color)', borderRadius:8, padding:'0.6rem 0.85rem', minWidth:160 }}>
      <p style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:5, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.06em' }}>
        LAP {lap}
      </p>
      {present.map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-primary)', flex:1 }}>{p.name}</span>
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:p.color, fontVariantNumeric:'tabular-nums' }}>P{p.value}</span>
        </div>
      ))}
      {retired.map(d => (
        <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2, opacity:0.6 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:d.color, flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', flex:1 }}>{d.acronym}</span>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#f59e0b' }}>DNF L{d.lastLap}</span>
        </div>
      ))}
      {dns.map(d => (
        <div key={d.driverId} style={{ display:'flex', alignItems:'center', gap:'0.45rem', marginBottom:2, opacity:0.5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-muted)', flexShrink:0 }} />
          <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', flex:1 }}>{d.acronym}</span>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--text-muted)' }}>DNS</span>
        </div>
      ))}
    </div>
  )
}

// ── Position Chart tab ────────────────────────────────────
function PositionTab({ raceId }) {
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

  // Keep ref in sync so tooltip can access without re-render issues
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

  const totalLaps    = data?.totalLaps || 0
  const dnfDrivers   = driverMeta.filter(d => d.dnf)
  const dnsDrivers   = driverMeta.filter(d => d.dns)
  const activeCount  = activeDrivers.length  // activeDrivers already includes DNF

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
          {/* Pit stop reference lines */}
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

      {/* Driver legend — active + DNF + DNS */}
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


// ── Race Pace tab ─────────────────────────────────────────
function PaceTab({ raceId, allDrivers }) {
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

    // Pre-compute per-driver set of laps to hide: pit lap + out-lap (lap after pit)
    const hiddenLaps = new Map()
    for (const d of meta) {
      const hide = new Set()
      for (const l of d.laps) {
        if (l.isPit) { hide.add(l.lap); hide.add(l.lap + 1) }
        // Extreme outlier (red flag, formation lap, >35% off median)
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

    // Detect SC/VSC periods: ≥2 drivers are simultaneously >10% slower than normal,
    // with no one pitting, for 2+ consecutive laps
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
    // Group consecutive SC laps into periods
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
      {/* Driver pills */}
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

      {/* Stat cards */}
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
                {/* SC / VSC periods — yellow band */}
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

            {/* Pit stops timeline */}
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

// ── Tire Strategy tab ─────────────────────────────────────
function TiresTab({ raceId }) {
  const [strategy, setStrategy] = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    telemetryApi.getTireStrategy(raceId)
      .then(setStrategy).catch(()=>{}).finally(()=>setLoading(false))
  }, [raceId])

  const totalLaps = strategy.length ? Math.max(...strategy.flatMap(d=>d.stints.map(s=>s.lapEnd))) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
        {Object.entries(COMPOUND_COLOR).filter(([k])=>k!=='UNKNOWN').map(([key,{bg}])=>(
          <div key={key} style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <div style={{ width:20, height:12, borderRadius:3, background:bg, border:'1px solid rgba(255,255,255,0.12)' }} />
            <span style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{key.charAt(0)+key.slice(1).toLowerCase()}</span>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(22,22,22,0.9)', border:'1px solid rgba(255,255,255,0.11)', borderRadius:8, padding:'1rem', overflowX:'auto' }}>
        {loading ? (
          <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Loading strategy...</span>
          </div>
        ) : !strategy.length ? (
          <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>No tire data (2023+ only)</span>
          </div>
        ) : (
          <div style={{ minWidth:560 }}>
            <div style={{ display:'flex', marginBottom:'0.4rem', paddingLeft:60 }}>
              <div style={{ flex:1, position:'relative', height:14 }}>
                {Array.from({length:Math.ceil(totalLaps/10)},(_,i)=>{
                  const lap=(i+1)*10
                  return lap>totalLaps ? null : (
                    <span key={lap} style={{ position:'absolute', left:`${(lap/totalLaps)*100}%`, transform:'translateX(-50%)', fontSize:'0.6rem', color:'rgba(255,255,255,0.2)' }}>{lap}</span>
                  )
                })}
                <span style={{ position:'absolute', right:0, fontSize:'0.6rem', color:'rgba(255,255,255,0.2)' }}>L{totalLaps}</span>
              </div>
            </div>
            {strategy.map(driver => {
              const lastLap = Math.max(...driver.stints.map(s => s.lapEnd))
              const dnf     = lastLap < totalLaps - 1
              return (
              <div key={driver.driverId} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.3rem' }}>
                <div style={{ width:52, flexShrink:0, textAlign:'right', fontFamily:"'Barlow Condensed', sans-serif", fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.05em' }}>
                  {driver.acronym}
                </div>
                <div style={{ flex:1, height:26, position:'relative', background:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden', opacity: dnf ? 0.75 : 1 }}>
                  {dnf && (
                    <div style={{ position:'absolute', left:`${(lastLap/totalLaps)*100}%`, top:0, bottom:0, width:2, background:'rgba(239,68,68,0.7)', zIndex:2 }} />
                  )}
                  {driver.stints.map(stint => {
                    const cKey=compound(stint.compound), col=COMPOUND_COLOR[cKey]
                    const left=((stint.lapStart-1)/totalLaps)*100
                    const width=((stint.lapEnd-stint.lapStart+1)/totalLaps)*100
                    const laps=stint.lapEnd-stint.lapStart+1
                    return (
                      <div key={stint.stintNumber}
                        title={`${cKey} · Laps ${stint.lapStart}–${stint.lapEnd} (${laps}L)${stint.tyreAge>0?` · Age: ${stint.tyreAge}`:''}`}
                        style={{ position:'absolute', left:`${left}%`, width:`${width}%`, top:0, bottom:0, background:col.bg, borderRight:'2px solid rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'default', transition:'filter 0.1s' }}
                        onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.2)'}
                        onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}
                      >
                        {width>5&&<span style={{ fontSize:'0.62rem', fontWeight:800, color:col.label, userSelect:'none' }}>{COMPOUND_ABBR[cKey]}{laps>4?` ${laps}`:''}</span>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ width:32, flexShrink:0 }}>
                  {dnf ? (
                    <span title={`Retired on lap ${lastLap}`} style={{ fontSize:'0.58rem', fontWeight:800, color:'#ef4444', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:3, padding:'1px 3px' }}>DNF</span>
                  ) : (
                    <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.2)' }}>{driver.stints.length}</span>
                  )}
                </div>
              </div>
              )
            })}
            <div style={{ paddingLeft:60, paddingTop:'0.4rem', fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:'0.2rem' }}>
              {strategy.length} drivers · {totalLaps} laps
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────
export default function RaceTelemetrySection({ season, raceName, circuitLocality, isUpcoming }) {
  const [tab,        setTab]        = useState('positions')
  const [raceId,     setRaceId]     = useState(null)
  const [allDrivers, setAllDrivers] = useState([])
  const [noData,     setNoData]     = useState(false)

  useEffect(() => {
    telemetryApi.getAvailableRaces().then(races => {
      // Match by year + locality first, then fall back to race name
      const yr     = season
      const local  = normalizeName(circuitLocality || '')
      const rName  = normalizeName(raceName || '')

      let match = races.find(r => {
        const [y] = r.raceId.split('_')
        if (y !== yr) return false
        const cn = normalizeName(r.raceName || '')
        return cn && local && (cn.includes(local.slice(0,5)) || local.includes(cn.slice(0,5)))
      })

      // Fallback: match by race name keywords
      if (!match) {
        match = races.find(r => {
          const [y] = r.raceId.split('_')
          if (y !== yr) return false
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

  const TABS = [
    { id:'positions', label:'Position Chart' },
    { id:'pace',      label:'Race Pace' },
    { id:'tires',     label:'Tire Strategy' },
  ]

  return (
    <div style={{
      background:'rgba(22,22,22,0.9)',
      border:'1px solid rgba(255,255,255,0.13)',
      borderTop:'2px solid #a855f7',
      borderRadius:12, overflow:'hidden',
      marginTop:'1rem',
    }}>
      {/* Header */}
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
              Telemetry data coming after the race
            </span>
            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
              Lap times, pit stops and tire strategy will be available once this race has been run
            </span>
          </div>
        ) : noData ? (
          <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
              Telemetry not available for this race · 2023+ only
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
