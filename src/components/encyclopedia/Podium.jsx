const colors = ['#c0c0c0', '#ffd700', '#cd7f32']
const podH   = [100, 130, 80]

export default function Podium({ results = [] }) {
  const top3  = results.slice(0, 3)
  const order = [top3[1], top3[0], top3[2]] // 2nd, 1st, 3rd visually

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.25rem', margin: '1rem 0' }}>
      {order.map((r, i) => r && (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 4 }}>
            {r.Driver?.familyName}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            {r.Constructor?.name}
          </div>
          <div style={{
            width: '100%', height: podH[i], borderRadius: '6px 6px 0 0',
            background: `linear-gradient(180deg, ${colors[i]}22, ${colors[i]}11)`,
            border: `1px solid ${colors[i]}55`, borderBottom: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 900, color: colors[i],
          }}>
            P{[2, 1, 3][i]}
          </div>
        </div>
      ))}
    </div>
  )
}
