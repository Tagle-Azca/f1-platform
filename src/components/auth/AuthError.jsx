export default function AuthError({ message }) {
  if (!message) return null
  return (
    <div style={{
      background: 'rgba(225,6,0,0.07)', border: '1px solid rgba(225,6,0,0.22)',
      borderRadius: 7, padding: '0.6rem 0.85rem',
      fontSize: '0.75rem', color: '#ff6b6b',
    }}>
      {message}
    </div>
  )
}
