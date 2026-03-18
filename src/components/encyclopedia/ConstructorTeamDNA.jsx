import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

function score(value, benchmark, cap = 10) {
  return Math.min(Math.round((value / benchmark) * 10 * 10) / 10, cap)
}

export default function ConstructorTeamDNA({ stats, color }) {
  if (!stats) return null

  const { races, wins, podiums, poles, reliability, championships } = stats
  if (!races) return null

  const data = [
    { subject: 'One-Lap Pace',   val: score(poles   / races, 0.15) },
    { subject: 'Race Pace',      val: score(wins    / races, 0.20) },
    { subject: 'Podium Rate',    val: score(podiums / races, 0.45) },
    { subject: 'Reliability',    val: reliability != null ? Math.round(reliability / 10 * 10) / 10 : 5 },
    { subject: 'Titles',         val: score(championships,   1.6)  },
  ]

  return (
    <div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
        Team DNA · All-Time
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 }}
          />
          <Radar
            dataKey="val" name="Team"
            stroke={color} fill={color} fillOpacity={0.18}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: '-0.25rem' }}>
        {data.map(d => (
          <div key={d.subject} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.7 }} />
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{d.subject}</span>
            <span style={{ fontSize: '0.58rem', color, fontWeight: 700 }}>{d.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
