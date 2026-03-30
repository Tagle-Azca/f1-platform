import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal from './LoginModal'

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

function UserMenu({ user, onClose, onLogout }) {
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function go(path) { onClose(); navigate(path) }

  const initials = user.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 240,
        background: 'rgba(8,8,8,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderTop: '2px solid var(--f1-red)',
        borderRadius: 10,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        zIndex: 1001,
        animation: 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* User info */}
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--f1-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '0.82rem', color: '#fff',
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.displayName || 'Pitwall User'}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      {[
        { label: 'My Garage', sub: 'Driver & team preferences', path: '/settings' },
        { label: 'Telemetry Presets', sub: 'Saved layouts & alerts', path: '/settings?tab=presets' },
      ].map(({ label, sub, path }) => (
        <button
          key={path}
          onClick={() => go(path)}
          style={{
            width: '100%', textAlign: 'left', background: 'none', border: 'none',
            padding: '0.65rem 1rem', cursor: 'pointer', transition: 'background 0.12s',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
        </button>
      ))}

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          padding: '0.65rem 1rem', cursor: 'pointer', transition: 'background 0.12s',
          fontSize: '0.75rem', color: 'rgba(225,6,0,0.8)', fontWeight: 600,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,6,0,0.06)'; e.currentTarget.style.color = 'var(--f1-red)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(225,6,0,0.8)' }}
      >
        Sign out
      </button>

      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

export default function GuestProfile() {
  const { user, loading, logout } = useAuth()
  const [modalOpen, setModalOpen]     = useState(false)
  const [menuOpen,  setMenuOpen]      = useState(false)
  const containerRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (loading) return null

  // ── Logged-in state ───────────────────────────────────────
  if (user) {
    const initials = user.displayName
      ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : user.email[0].toUpperCase()

    return (
      <div ref={containerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.5rem 0.3rem 0.3rem',
            background: menuOpen ? 'var(--surface-3)' : 'var(--surface-2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--f1-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: '0.7rem', color: '#fff',
          }}>
            {initials}
          </div>
          <span style={{ color: menuOpen ? 'var(--text-muted)' : 'transparent', transition: 'color 0.15s', display: 'flex' }}>
            <IconChevron />
          </span>
        </button>

        {menuOpen && (
          <UserMenu
            user={user}
            onClose={() => setMenuOpen(false)}
            onLogout={async () => { setMenuOpen(false); await logout() }}
          />
        )}
      </div>
    )
  }

  // ── Guest state ───────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
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

      <LoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
