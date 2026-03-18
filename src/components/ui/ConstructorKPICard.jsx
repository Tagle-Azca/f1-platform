import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function ConstructorKPICard({ label, value, sub, color, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? '#22c55e' : trend < 0 ? 'var(--f1-red)' : 'var(--text-muted)'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 10,
      padding: '0.75rem 1rem',
      flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{
          fontSize: '1.35rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          color: color || 'var(--text-primary)',
          fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1,
        }}>
          {value ?? '—'}
        </span>
        {trend !== undefined && (
          <TrendIcon size={13} style={{ color: trendColor, flexShrink: 0 }} />
        )}
      </div>
      {sub && (
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>
          {sub}
        </div>
      )}
    </div>
  )
}
