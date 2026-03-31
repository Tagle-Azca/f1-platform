import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal   from './LoginModal'
import GarageDrawer from '../garage/GarageDrawer'

function IconUser() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}


export default function GuestProfile() {
  const { user, loading } = useAuth()
  const [loginOpen,  setLoginOpen]  = useState(false)
  const [garageOpen, setGarageOpen] = useState(false)

  if (loading) return null

  // ── Logged-in state ───────────────────────────────────────
  if (user) {
    const initials = user.displayName
      ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : user.email[0].toUpperCase()

    return (
      <>
        <button
          onClick={() => setGarageOpen(true)}
          title="My Garage"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.5rem 0.3rem 0.3rem',
            background: 'var(--surface-2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.background = 'var(--surface-3)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'var(--surface-2)' }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--accent-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '0.7rem', color: '#000',
            transition: 'background 0.3s',
          }}>
            {initials}
          </div>
          <span style={{ color: 'var(--text-muted)', display: 'flex', transition: 'color 0.15s' }}>
            <IconChevron />
          </span>
        </button>

        <GarageDrawer open={garageOpen} onClose={() => setGarageOpen(false)} />
      </>
    )
  }

  // ── Guest state ───────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setLoginOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.65rem',
          background: 'transparent',
          border: '1px dashed rgba(255,255,255,0.2)',
          borderRadius: 8, cursor: 'pointer',
          color: 'var(--text-muted)',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(225,6,0,0.4)'
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.background = 'rgba(225,6,0,0.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <IconUser />
        Guest
      </button>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
