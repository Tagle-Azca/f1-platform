import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import AuthField   from './AuthField'
import AuthInput   from './AuthInput'
import AuthError   from './AuthError'
import AuthDivider from './AuthDivider'
import { IconEye, IconGoogle, IconClose } from './authIcons'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const ERROR_ID = 'login-error'

export default function LoginModal({ open, onClose }) {
  const { login, loginWithGoogle } = useAuth()
  const navigate     = useNavigate()
  const googleBtnRef = useRef(null)
  const titleId      = useId()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState(null)
  const [busy,     setBusy]     = useState(false)

  // Esc + focus trap + focus return to the trigger (Esc is handled by the hook).
  const stableClose = useCallback(() => onClose(), [onClose])
  const dialogRef = useFocusTrap(open, stableClose)

  // Never keep credentials or a revealed password around once the dialog is closed.
  // A login request that settles after the dialog was closed must not write state back into it.
  const openRef = useRef(open)
  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    if (open) return
    setEmail(''); setPassword(''); setShowPw(false); setError(null); setBusy(false)
  }, [open])

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
    catch (e) { if (openRef.current) setError(e.message) }
    finally { if (openRef.current) setBusy(false) }
  }

  function goTo(path) { onClose(); navigate(path) }

  const describedBy = error ? ERROR_ID : undefined

  return createPortal(
    <>
      <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm" />

      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-pw-4 overflow-y-auto pointer-events-none">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-nested-dialog
          tabIndex={-1}
          className="pointer-events-auto w-full max-w-[400px] bg-panel border border-edge border-t-2 border-t-steel rounded-md shadow-float overflow-hidden"
        >
          <ModalHeader onClose={onClose} titleId={titleId} />

          <div className="px-pw-6 pt-pw-5 pb-pw-6 flex flex-col gap-pw-3">
            <form onSubmit={handleSubmit} className="flex flex-col gap-pw-3" aria-busy={busy}>

              <AuthField label="Email">
                <AuthInput type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="driver@pitwall.io" autoComplete="email" required
                  aria-invalid={error ? true : undefined} aria-describedby={describedBy} />
              </AuthField>

              <div className="flex flex-col gap-pw-2">
                <AuthField label="Password">
                  <AuthInput
                    type={showPw ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password" required
                    aria-invalid={error ? true : undefined} aria-describedby={describedBy}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        aria-pressed={showPw}
                        aria-label="Show password"
                        className="inline-flex size-11 items-center justify-center bg-transparent border-0 cursor-pointer text-ink-2 hover:text-ink"
                      >
                        <IconEye show={showPw} />
                      </button>
                    }
                  />
                </AuthField>
                <button type="button" onClick={() => goTo('/forgot-password')}
                  className="self-end min-h-11 bg-transparent border-0 cursor-pointer text-sm text-ink-2 hover:text-ink underline underline-offset-2">
                  Forgot access code?
                </button>
              </div>

              <AuthError id={ERROR_ID} message={error} />

              <button type="submit" disabled={busy} aria-disabled={busy}
                className="mt-pw-1 min-h-12 rounded-sm border-0 bg-steel text-bg font-condensed text-base font-extrabold tracking-[0.1em] uppercase cursor-pointer hover:bg-steel-hi disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <AuthDivider />

            {GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} className="flex justify-center" />
            ) : (
              <button disabled className="w-full min-h-11 px-pw-4 rounded-sm bg-white/5 border border-white/10 cursor-not-allowed flex items-center justify-center gap-pw-3 text-ink-3 text-sm font-semibold">
                <IconGoogle />
                Continue with Google
                <span className="text-xs ml-1">(coming soon)</span>
              </button>
            )}

            <p className="text-center text-sm text-ink-2">
              No account?{' '}
              <button type="button" onClick={() => goTo('/register')}
                className="min-h-11 bg-transparent border-0 cursor-pointer text-steel font-bold hover:text-steel-hi underline underline-offset-2 p-0">
                Join the Pitwall
              </button>
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

function ModalHeader({ onClose, titleId }) {
  return (
    <div className="px-pw-6 pt-pw-5 pb-pw-4 border-b border-edge-soft flex items-start justify-between">
      <div>
        <p className="font-condensed text-xs font-bold tracking-[0.18em] uppercase text-steel mb-pw-1">
          PITWALL INTELLIGENCE
        </p>
        <h2 id={titleId} className="font-condensed text-2xl font-black tracking-[0.06em] uppercase text-ink leading-none">
          ACCESS CONTROL
        </h2>
        <p className="text-sm text-ink-2 mt-pw-2">Sign in to save your layout and telemetry presets</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Close sign-in"
        className="inline-flex size-11 shrink-0 items-center justify-center -mr-pw-2 -mt-pw-2 rounded-sm bg-transparent border-0 cursor-pointer text-ink-2 hover:text-ink">
        <IconClose />
      </button>
    </div>
  )
}
