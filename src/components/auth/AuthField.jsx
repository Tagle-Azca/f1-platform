export default function AuthField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}
