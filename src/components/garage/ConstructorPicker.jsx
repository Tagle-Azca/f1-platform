import { usePreferences } from '../../contexts/PreferencesContext'
import { F1_TEAMS, getTeam } from '../../data/f1Teams'


function ClearChip({ onClear, label = 'None' }) {
  return (
    <button
      onClick={onClear}
      style={{
        padding: '0.35rem 0.5rem',
        background: 'transparent',
        border: '1px dashed rgba(255,255,255,0.15)',
        borderRadius: 7, cursor: 'pointer',
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
    >
      {label}
    </button>
  )
}

function SubLabel({ children, onClear, hasClear }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{
        fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
      }}>
        {children}
      </span>
      {hasClear && (
        <button onClick={onClear} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: 0, transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
        >
          Clear ×
        </button>
      )}
    </div>
  )
}

// ── Team picker ────────────────────────────────────────────────────────────

function TeamPicker() {
  const { draft, setDraft, previewAccent } = usePreferences()

  function pickTeam(teamId) {
    setDraft({ favoriteTeam: teamId })
    previewAccent(teamId, draft.favoriteDriver)
  }

  function clearTeam() {
    setDraft({ favoriteTeam: null })
    previewAccent(null, draft.favoriteDriver)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <SubLabel onClear={clearTeam} hasClear={!!draft.favoriteTeam}>
        Favorite Constructor
      </SubLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
        {F1_TEAMS.map(team => {
          const active = draft.favoriteTeam === team.id
          return (
            <button
              key={team.id}
              onClick={() => pickTeam(team.id)}
              title={team.name}
              style={{
                padding: '0.5rem 0.25rem',
                background: active ? `${team.color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? team.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 7, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                transition: 'all 0.2s',
                boxShadow: active ? `0 0 14px ${team.color}44` : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = `${team.color}55` }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <div style={{ width: 20, height: 4, borderRadius: 2, background: team.color }} />
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
                color: active ? team.color : 'var(--text-muted)', transition: 'color 0.2s',
              }}>
                {team.short}
              </span>
            </button>
          )
        })}
      </div>
      {draft.favoriteTeam && (
        <div style={{
          fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em',
          textAlign: 'center', paddingTop: '0.15rem',
        }}>
          {getTeam(draft.favoriteTeam)?.name}
        </div>
      )}
    </div>
  )
}

// ── Driver picker (all 20 drivers, independent of team) ────────────────────

function DriverPicker() {
  const { draft, setDraft, previewAccent } = usePreferences()

  function clearDriver() {
    setDraft({ favoriteDriver: null })
    previewAccent(draft.favoriteTeam, null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <SubLabel onClear={clearDriver} hasClear={!!draft.favoriteDriver}>
        Focus Driver
      </SubLabel>
      <p style={{ margin: 0, fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.03em' }}>
        Independent of constructor — highlights telemetry &amp; standings
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {F1_TEAMS.map(team => (
          <div key={team.id}>
            {/* Team label */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0', marginTop: '0.25rem',
            }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: team.color, flexShrink: 0 }} />
              <span style={{
                fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: team.color, opacity: 0.7,
              }}>
                {team.short}
              </span>
            </div>
            {/* Two drivers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
              {team.drivers.map(driver => {
                const active = draft.favoriteDriver === driver
                return (
                  <button
                    key={driver}
                    onClick={() => {
                      const next = active ? null : driver
                      setDraft({ favoriteDriver: next })
                      previewAccent(draft.favoriteTeam, next)
                    }}
                    style={{
                      padding: '0.4rem 0.6rem', textAlign: 'left',
                      background: active ? `${team.color}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${active ? team.color : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 6, cursor: 'pointer',
                      color: active ? team.color : 'rgba(255,255,255,0.55)',
                      fontSize: '0.7rem', fontWeight: active ? 700 : 400,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: '0.03em', textTransform: 'uppercase',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      boxShadow: active ? `0 0 10px ${team.color}33` : 'none',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = `${team.color}44`; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' } }}
                  >
                    {driver.split(' ').pop()}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────

export default function ConstructorPicker() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <TeamPicker />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
      <DriverPicker />
    </div>
  )
}
