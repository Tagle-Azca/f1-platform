import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePreferences } from '../../contexts/PreferencesContext'
import PaddockPass           from './PaddockPass'
import ConstructorPicker     from './ConstructorPicker'
import TelemetryToggles      from './TelemetryToggles'
import DashboardLayoutPicker from './DashboardLayoutPicker'

function SectionBlock({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{
          fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>
      {children}
    </div>
  )
}

export default function GarageDrawer({ open, onClose }) {
  const { logout } = useAuth()
  const { applyChanges, resetDraft, resetAll } = usePreferences()
  const [busy,   setBusy]   = useState(false)
  const [synced, setSynced] = useState(false)
  const [error,  setError]  = useState(null)

  async function handleApply() {
    setBusy(true); setSynced(false); setError(null)
    try {
      await applyChanges()
      setSynced(true)
      setTimeout(() => setSynced(false), 2500)
    } catch (err) {
      setError(err.message || 'Failed to save — check your connection')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    resetDraft()
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        height: '100dvh', width: 'min(420px, 100vw)',
        zIndex: 1101,
        background: 'rgba(9,9,9,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--accent-color)', marginBottom: '0.2rem',
              transition: 'color 0.3s',
            }}>
              MY GARAGE // CONFIG_PANEL
            </div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--text-primary)', lineHeight: 1,
            }}>
              Pitwall HQ
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, cursor: 'pointer', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.75rem',
        }}>

          <SectionBlock title="Paddock Pass">
            <PaddockPass />
          </SectionBlock>

          <SectionBlock title="Constructor &amp; Driver">
            <ConstructorPicker />
          </SectionBlock>

          <SectionBlock title="Dashboard Layout">
            <DashboardLayoutPicker />
          </SectionBlock>

          <SectionBlock title="Telemetry Config">
            <TelemetryToggles />
          </SectionBlock>

        </div>

        {/* Footer: Apply + Logout */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
          flexShrink: 0,
        }}>
          {error && (
            <div style={{
              background: 'rgba(225,6,0,0.08)', border: '1px solid rgba(225,6,0,0.25)',
              borderRadius: 7, padding: '0.5rem 0.75rem',
              fontSize: '0.7rem', color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={busy}
            style={{
              width: '100%', padding: '0.8rem',
              background: synced
                ? 'rgba(34,197,94,0.15)'
                : busy
                  ? 'rgba(255,255,255,0.04)'
                  : 'var(--accent-color)',
              border: `1px solid ${synced ? '#22c55e' : busy ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
              borderRadius: 9, cursor: busy ? 'not-allowed' : 'pointer',
              color: synced ? '#22c55e' : busy ? 'var(--text-muted)' : '#000',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.14em',
              textTransform: 'uppercase', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}
          >
            {busy && <SyncSpinner />}
            {synced ? '✓  Changes Applied' : busy ? 'Syncing...' : 'Apply Changes to Pitwall'}
          </button>

          <button
            onClick={() => { resetAll() }}
            style={{
              width: '100%', padding: '0.5rem',
              background: 'none', border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 7, cursor: 'pointer',
              color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            Reset to Clean Look
          </button>

          <button
            onClick={async () => { onClose(); await logout() }}
            style={{
              width: '100%', padding: '0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(225,6,0,0.6)', fontSize: '0.7rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--f1-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(225,6,0,0.6)'}
          >
            Sign Out
          </button>
        </div>

      </div>
    </>
  )
}

function SyncSpinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  )
}
