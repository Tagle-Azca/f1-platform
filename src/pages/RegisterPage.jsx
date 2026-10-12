import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { validatePassword } from '../utils/passwordStrength'
import AuthField        from '../components/auth/AuthField'
import AuthInput        from '../components/auth/AuthInput'
import AuthError        from '../components/auth/AuthError'
import AuthDivider      from '../components/auth/AuthDivider'
import PasswordStrength from '../components/auth/PasswordStrength'
import TelemetrySelect  from '../components/auth/TelemetrySelect'
import { IconEye, IconGoogle, IconApple } from '../components/auth/authIcons'

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const CY     = new Date().getFullYear()
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
const MONTHS_OPTS = MONTHS.map(m => ({ value: m, label: m }))
const YEARS_OPTS  = Array.from({ length: 100 }, (_, i) => String(CY - 13 - i)).map(y => ({ value: y, label: y }))

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={show} aria-label="Show password" style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--pw-ink-2)', padding: 0, display: 'flex',
      minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    }}>
      <IconEye show={show} />
    </button>
  )
}

function SocialButton({ icon, label }) {
  return (
    <button type="button" disabled style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
      padding: '0.6rem 0.75rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 8, cursor: 'not-allowed',
      color: 'rgba(255,255,255,0.3)',
      fontSize: '0.78rem', fontWeight: 600,
      opacity: 0.5,
    }}>
      {icon}
      {label}
      <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)' }}>(coming soon)</span>
    </button>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [dob,  setDob]  = useState({ day: '', month: '', year: '' })
  const [showPw, setShowPw] = useState(false)
  const [error,  setError]  = useState(null)
  const [busy,   setBusy]   = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setD = (key) => (e) => setDob(d => ({ ...d, [key]: e.target.value }))

  const dobISO = dob.day && dob.month && dob.year
    ? `${dob.year}-${String(MONTHS.indexOf(dob.month) + 1).padStart(2, '0')}-${dob.day}`
    : null

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const pwError = validatePassword(form.password)
    if (pwError) { setError(pwError); return }
    setBusy(true); setError(null)
    try {
      await register({ ...form, dateOfBirth: dobISO })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [register, form, dobISO, navigate])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      <PageBackground />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
        <BackLink />

        <div style={{
          background: 'rgba(10,10,10,0.92)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderTop: '2px solid var(--pw-steel)',
          borderRadius: 16,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
          overflow: 'hidden',
        }}>
          <CardHeader />

          <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <AuthField label="First Name">
                <AuthInput variant="underline" value={form.firstName} onChange={set('firstName')}
                  aria-describedby={error ? 'register-error' : undefined} aria-invalid={error ? true : undefined}
                  placeholder="Max" autoComplete="given-name" required />
              </AuthField>
              <AuthField label="Last Name">
                <AuthInput variant="underline" value={form.lastName} onChange={set('lastName')}
                  aria-describedby={error ? 'register-error' : undefined} aria-invalid={error ? true : undefined}
                  placeholder="Verstappen" autoComplete="family-name" required />
              </AuthField>
            </div>

            <AuthField label="Email">
              <AuthInput variant="underline" type="email" value={form.email} onChange={set('email')}
                  aria-describedby={error ? 'register-error' : undefined} aria-invalid={error ? true : undefined}
                placeholder="driver@pitwall.io" autoComplete="email" required />
            </AuthField>

            <AuthField label="Password">
              <AuthInput
                variant="underline"
                type={showPw ? 'text' : 'password'}
                value={form.password} onChange={set('password')}
                  aria-describedby={error ? 'register-error' : undefined} aria-invalid={error ? true : undefined}
                placeholder="Min. 8 characters" autoComplete="new-password" required
                rightSlot={<EyeToggle show={showPw} onToggle={() => setShowPw(v => !v)} />}
              />
              <PasswordStrength password={form.password} />
            </AuthField>

            <AuthField label="Date of Birth — Technical Readout">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.3fr', gap: '0.6rem' }}>
                <TelemetrySelect value={dob.day}   onChange={setD('day')}   options={DAYS}        placeholder="DD"   label="Day of birth" />
                <TelemetrySelect value={dob.month} onChange={setD('month')} options={MONTHS_OPTS} placeholder="MON"  label="Month of birth" />
                <TelemetrySelect value={dob.year}  onChange={setD('year')}  options={YEARS_OPTS}  placeholder="YYYY" label="Year of birth" />
              </div>
            </AuthField>

            <AuthError id="register-error" message={error} />

            <SubmitButton busy={busy} />

            <AuthDivider label="or continue with" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <SocialButton icon={<IconGoogle />} label="Google" />
              <SocialButton icon={<IconApple />}  label="Apple"  />
            </div>

            <p style={{ textAlign: 'center', margin: 0, fontSize: '0.72rem', color: 'var(--pw-ink-2)' }}>
              Already have access?{' '}
              <Link to="/" style={{ color: 'var(--pw-steel)', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>

          </form>
        </div>
      </div>

    </div>
  )
}

// ── Static sub-components (no state, no props needed from parent) ──────────

function PageBackground() {
  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      <div style={{
        position: 'fixed', top: -120, left: -80, width: 400, height: 400,
        background: 'radial-gradient(circle,rgba(225,6,0,0.08) 0%,transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
    </>
  )
}

function BackLink() {
  return (
    <Link to="/" style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      color: 'var(--pw-ink-2)', fontSize: '0.8rem', textDecoration: 'none',
      marginBottom: '1.5rem', letterSpacing: '0.06em', transition: 'color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
    >
      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      BACK TO PITWALL
    </Link>
  )
}

function CardHeader() {
  return (
    <div style={{
      padding: '2rem 2rem 1.5rem',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'linear-gradient(180deg,rgba(225,6,0,0.04) 0%,transparent 100%)',
    }}>
      <div style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: 'var(--pw-steel)', marginBottom: '0.6rem',
      }}>
        PITWALL INTELLIGENCE · PADDOCK ACCESS
      </div>
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 'clamp(1.4rem,4vw,1.85rem)',
        fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase',
        color: 'var(--text-primary)', lineHeight: 1.1, margin: 0,
      }}>
        One more step to<br />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
          become part of the paddock
        </span>
      </h1>
    </div>
  )
}

function SubmitButton({ busy }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-disabled={busy}
      className="min-h-12 rounded-md border-0 bg-steel text-bg font-condensed text-base font-black tracking-[0.12em] uppercase cursor-pointer hover:bg-steel-hi disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {busy ? 'Registering...' : 'Join the Paddock'}
    </button>
  )
}
