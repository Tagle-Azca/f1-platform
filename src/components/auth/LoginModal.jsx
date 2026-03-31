import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthField   from './AuthField'
import AuthInput   from './AuthInput'
import AuthError   from './AuthError'
import AuthDivider from './AuthDivider'
import { IconEye, IconGoogle, IconClose } from './authIcons'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginModal({ open, onClose }) {
  const { login, loginWithGoogle } = useAuth()
  const navigate     = useNavigate()
  const googleBtnRef = useRef(null)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState(null)
  const [busy,     setBusy]     = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open || !GOOGLE_CLIENT_ID || !window.google || !googleBtnRef.current) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setBusy(true); setError(null)
        try { await loginWithGoogle(credential); onClose() }
        catch (e) { setError(e.message) }
        finally { setBusy(false) }
      },
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'filled_black', size: 'large', shape: 'rectangular',
      text: 'signin_with', width: 340,
    })
  }, [open, loginWithGoogle, onClose])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await login(email, password); onClose() }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  function goTo(path) { onClose(); navigate(path) }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '100dvh', zIndex: 999,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.18s ease',
      }} />

      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '100dvh',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', pointerEvents: 'none',
        overflowY: 'auto',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          pointerEvents: 'all', width: '100%', maxWidth: 400,
          background: 'rgba(8,8,8,0.98)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: '2px solid var(--f1-red)',
          borderRadius: 14,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'slideDown 0.22s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}>
          <ModalHeader onClose={onClose} />

          <div style={{ padding: '1.25rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              <AuthField label="Email">
                <AuthInput type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="driver@pitwall.io" autoComplete="email" required />
              </AuthField>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <PasswordLabel onForgot={() => goTo('/forgot-password')} />
                <AuthInput
                  type={showPw ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" required
                  rightSlot={
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: 0, display: 'flex',
                    }}>
                      <IconEye show={showPw} />
                    </button>
                  }
                />
              </div>

              <AuthError message={error} />

              <button type="submit" disabled={busy} style={{
                marginTop: '0.25rem', padding: '0.75rem',
                background: busy ? 'rgba(225,6,0,0.4)' : 'var(--f1-red)',
                border: 'none', borderRadius: 8, cursor: busy ? 'not-allowed' : 'pointer',
                color: '#fff', fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', transition: 'background 0.15s',
                boxShadow: busy ? 'none' : '0 4px 16px rgba(225,6,0,0.3)',
              }}
                onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#c00500' }}
                onMouseLeave={e => { if (!busy) e.currentTarget.style.background = 'var(--f1-red)' }}
              >
                {busy ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <AuthDivider />

            {GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
            ) : (
              <button disabled style={{
                width: '100%', padding: '0.7rem 1rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, cursor: 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
                color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', fontWeight: 600,
              }}>
                <IconGoogle />
                Continue with Google
                <span style={{ fontSize: '0.6rem', marginLeft: '0.25rem' }}>(coming soon)</span>
              </button>
            )}

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No account? </span>
              <button onClick={() => goTo('/register')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', color: 'var(--f1-red)', fontWeight: 700, padding: 0,
              }}>
                Join the Pitwall →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  )
}

// ── Static sub-components ──────────────────────────────────────────────────

function ModalHeader({ onClose }) {
  return (
    <div style={{
      padding: '1.25rem 1.5rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--f1-red)', marginBottom: '0.35rem',
        }}>
          PITWALL INTELLIGENCE
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '1.45rem', fontWeight: 900, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--text-primary)', lineHeight: 1,
        }}>
          ACCESS CONTROL
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
          Sign in to save your layout and telemetry presets
        </div>
      </div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 6,
        flexShrink: 0, marginLeft: '0.5rem', transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <IconClose />
      </button>
    </div>
  )
}

function PasswordLabel({ onForgot }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
        Password
      </span>
      <button type="button" onClick={onForgot} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '0.65rem', color: 'var(--text-muted)', padding: 0, transition: 'color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--f1-red)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        Forgot access code?
      </button>
    </div>
  )
}
