import { getStrength, getChecks, STRENGTH_META } from '../../utils/passwordStrength'

const CHECK_ITEMS = [
  { key: 'length',  label: '8+ characters',      required: true  },
  { key: 'letter',  label: 'Contains a letter',   required: true  },
  { key: 'number',  label: 'Contains a number',   required: true  },
  { key: 'upper',   label: 'Uppercase letter',     required: false },
  { key: 'special', label: 'Special character',    required: false },
  { key: 'long',    label: '12+ characters',       required: false },
]

export default function PasswordStrength({ password }) {
  if (!password) return null

  const score   = getStrength(password)
  const checks  = getChecks(password)
  const meta    = STRENGTH_META[score]
  const color   = meta?.color ?? 'rgba(255,255,255,0.15)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>

      {/* Bar + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ flex: 1, display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: score >= i ? color : 'rgba(255,255,255,0.08)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        {meta && (
          <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color, minWidth: 44 }}>
            {meta.label}
          </span>
        )}
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.75rem' }}>
        {CHECK_ITEMS.map(({ key, label, required }) => {
          const ok = checks[key]
          return (
            <span key={key} style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.6rem', letterSpacing: '0.04em',
              color: ok ? '#22c55e' : required ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)',
              transition: 'color 0.2s',
            }}>
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                {ok
                  ? <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  : <circle cx="6" cy="6" r="4" stroke={required ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'} strokeWidth={1.5}/>
                }
              </svg>
              {label}
            </span>
          )
        })}
      </div>

    </div>
  )
}
