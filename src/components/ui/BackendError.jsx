export default function BackendError({ onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '0.75rem', padding: '3rem 1rem',
      textAlign: 'center',
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{ width: 48, height: 48, opacity: 0.85 }}>
        <rect x="10" y="8" width="4" height="48" rx="2" fill="var(--text-muted)" />
        <rect x="14" y="8" width="36" height="22" rx="2" fill="#e10600" />
        <rect x="14" y="8"  width="12" height="11" fill="#c00" />
        <rect x="26" y="19" width="12" height="11" fill="#c00" />
        <rect x="38" y="8"  width="12" height="11" fill="#c00" />
      </svg>

      <div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.5rem',
          fontWeight: 900, letterSpacing: '0.08em', color: '#e10600',
          textTransform: 'uppercase', lineHeight: 1,
        }}>
          Safety Car Deployed
        </div>
        <div style={{
          fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem',
        }}>
          The pit wall is unreachable. Check back shortly.
        </div>
      </div>

      {onRetry && (
        <button className="btn btn--ghost" style={{ fontSize: '0.78rem', marginTop: '0.25rem' }} onClick={onRetry}>
          Back to the pits
        </button>
      )}
    </div>
  )
}
