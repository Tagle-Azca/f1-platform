import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, minHeight: '70vh' }}>

      <div style={{
        background: 'linear-gradient(135deg, rgba(225,6,0,0.08), transparent)',
        border: '1px solid rgba(225,6,0,0.25)',
        borderLeft: '3px solid var(--f1-red)',
        borderRadius: 14, padding: '2rem 2.5rem',
        width: '100%', maxWidth: 520, textAlign: 'center', marginBottom: '0.75rem',
      }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--f1-red)', fontWeight: 700, marginBottom: '0.5rem', fontFamily: "'Barlow Condensed', sans-serif" }}>
          🚩 RED FLAG · SESSION SUSPENDED
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(4rem,12vw,6rem)', fontWeight: 900,
          color: 'var(--text-primary)', lineHeight: 0.9,
          letterSpacing: '-0.02em',
        }}>
          ERROR<br />
          <span style={{ color: 'var(--f1-red)' }}>404</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
          This page is outside the track limits. Rejoin from the pit lane.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 520 }}>
        <button
          className="btn"
          style={{ flex: 1, background: 'var(--f1-red)', color: '#fff', border: 'none', fontWeight: 700 }}
          onClick={() => window.history.back()}
        >
          Back to Track
        </button>
        <button
          className="btn"
          style={{ flex: 1 }}
          onClick={() => navigate('/')}
        >
          Back to Pits
        </button>
      </div>

    </div>
  )
}
