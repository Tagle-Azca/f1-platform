import { useAuth } from '../../contexts/AuthContext'
import { getTeam } from '../../data/f1Teams'
import { usePreferences } from '../../contexts/PreferencesContext'

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

function shortId(id = '') {
  return id.toString().slice(-8).toUpperCase()
}

export default function PaddockPass() {
  const { user } = useAuth()
  const { draft } = usePreferences()

  const team     = getTeam(draft.favoriteTeam)
  const accentColor = team?.color ?? '#e10600'
  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accentColor}33`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: 10,
      padding: '1rem',
      display: 'flex', gap: '0.85rem', alignItems: 'center',
      transition: 'border-color 0.3s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: `${accentColor}22`,
        border: `2px solid ${accentColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900, fontSize: '1rem', color: accentColor,
        transition: 'all 0.3s',
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: accentColor, marginBottom: '0.25rem',
          transition: 'color 0.3s',
        }}>
          FIA · PADDOCK PASS · {team?.short ?? 'GUEST'}
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.04em',
          textTransform: 'uppercase', color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {user?.displayName || user?.email || 'Unknown Driver'}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            DOB {fmt(user?.dateOfBirth)}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
            #{shortId(user?._id)}
          </span>
        </div>
      </div>
    </div>
  )
}
