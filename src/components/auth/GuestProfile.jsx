import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal   from './LoginModal'
import GarageDrawer from '../garage/GarageDrawer'

function IconUser() {
  return (
    <svg aria-hidden="true" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg aria-hidden="true" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}


const BTN = 'w-full flex items-center gap-pw-3 min-h-11 px-pw-3 rounded-md bg-white/5 border border-edge-soft text-ink cursor-pointer font-sans text-base font-medium transition-colors hover:bg-white/10'
// Guest CTA: steel fill so it reads as an action, not a disabled row
const GUEST_BTN = 'w-full flex items-center gap-pw-3 min-h-11 px-pw-3 rounded-md bg-steel-soft border border-steel text-ink-2 cursor-pointer font-sans text-base font-semibold transition-colors hover:bg-steel hover:text-bg'

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
        <button type="button" onClick={() => setGarageOpen(true)} aria-haspopup="dialog" className={BTN}>
          <span aria-hidden="true" className="size-6 rounded-sm shrink-0 bg-steel-soft grid place-items-center font-condensed font-bold text-xs text-steel">
            {initials}
          </span>
          <span className="flex-1 text-left truncate">{user.displayName || 'My Garage'}</span>
          <span aria-hidden="true" className="text-ink-3 flex shrink-0"><IconChevron /></span>
        </button>

        <GarageDrawer open={garageOpen} onClose={() => setGarageOpen(false)} />
      </>
    )
  }

  // ── Guest state ───────────────────────────────────────────
  return (
    <>
      <button type="button" onClick={() => setLoginOpen(true)} aria-haspopup="dialog" className={GUEST_BTN}>
        <span aria-hidden="true" className="size-6 rounded-sm shrink-0 grid place-items-center">
          <IconUser />
        </span>
        <span>Sign in</span>
      </button>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
