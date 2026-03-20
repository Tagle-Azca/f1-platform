export default function HomeFooter() {
  return (
    <p style={{
      textAlign: 'center',
      marginTop: '3rem',
      fontSize: '0.65rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      opacity: 0.6,
    }}>
      Data sourced from Jolpica F1 API · OpenF1 · 1950 – {new Date().getFullYear()}
      <br />
      <span style={{ marginTop: '0.5rem', display: 'block', fontWeight: 700, color: 'var(--f1-red)' }}>
        Designed &amp; Engineered by Andres Gomez Tagle Azcarraga
      </span>
    </p>
  )
}
