import { useState, useEffect } from 'react'
import { telemetryApi } from '../../services/api'
import { COMPOUND_COLOR, COMPOUND_ABBR, compound } from './raceTelemetryConstants'

export default function TiresTab({ raceId }) {
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
