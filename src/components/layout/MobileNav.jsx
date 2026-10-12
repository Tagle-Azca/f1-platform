import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { getMobilePrimaryItems } from '../../config/navConfig'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import NavList from './NavList'
import GuestProfile from '../auth/GuestProfile'
import { Brand } from './Sidebar'

function Drawer({ onClose, onNavigated }) {
  // Esc closes the drawer, unless a nested dialog (sign-in) is open: that one handles its own Esc.
  const safeClose = useCallback(() => {
    if (document.querySelector('[data-nested-dialog]')) return
    onClose()
  }, [onClose])
  const trapRef = useFocusTrap(true, safeClose)

  const closeAndFocusMain = useCallback(() => {
    onNavigated()
    onClose()
  }, [onClose, onNavigated])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <>
      <motion.div
        key="scrim"
        aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[98] bg-black/60"
      />
      <motion.div
        key="drawer"
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        tabIndex={-1}
        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed top-0 left-0 bottom-0 z-[99] w-[85vw] max-w-80 flex flex-col bg-sidebar border-r border-edge-soft shadow-float"
      >
        <div className="flex items-start justify-between">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="m-pw-2 inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-white/5 hover:text-ink"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <nav aria-label="Main menu" className="flex-1 overflow-y-auto px-pw-3 pb-pw-3">
          <NavList onNavigate={closeAndFocusMain} />
        </nav>
        <div className="p-pw-3">
          <GuestProfile />
        </div>
      </motion.div>
    </>
  )
}

/** Bottom tab bar (<768px): 4 primary destinations + "More" which opens the full-nav drawer. */
export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const close = useCallback(() => setOpen(false), [])
  const focusMainAfterExit = useRef(false)
  const markNavigated = useCallback(() => { focusMainAfterExit.current = true }, [])
  const items = getMobilePrimaryItems()

  // The drawer must never stay open across a viewport change to desktop.
  useEffect(() => {
    const mql = window.matchMedia?.('(min-width: 768px)')
    if (!mql) return
    const h = () => { if (mql.matches) setOpen(false) }
    mql.addEventListener('change', h)
    return () => mql.removeEventListener('change', h)
  }, [])

  const tabCls = (active) => [
    'relative flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 min-h-14 min-w-11 no-underline text-xs transition-colors',
    active ? 'text-steel font-semibold' : 'text-ink-2 font-medium',
  ].join(' ')

  return (
    <>
      <nav
        aria-label="Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex bg-sidebar border-t border-edge pb-[env(safe-area-inset-bottom)]"
      >
        {items.map(item => {
          const Icon = item.icon
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className={() => tabCls(active)}>
              {active && <span aria-hidden="true" className="absolute top-0 inset-x-4 h-0.5 rounded-pill bg-steel" />}
              <Icon aria-hidden="true" className="size-[22px]" />
              <span className="truncate max-w-full px-1">{item.label}</span>
            </NavLink>
          )
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={tabCls(false) + ' bg-transparent border-0 cursor-pointer'}
        >
          <Menu aria-hidden="true" className="size-[22px]" />
          <span>More</span>
        </button>
      </nav>
      <AnimatePresence
        onExitComplete={() => {
          // The focus trap restores focus to "More" on unmount; after choosing a link, focus <main> instead.
          if (focusMainAfterExit.current) {
            focusMainAfterExit.current = false
            requestAnimationFrame(() => document.getElementById('main')?.focus())
          }
        }}
      >
        {open && <Drawer onClose={close} onNavigated={markNavigated} />}
      </AnimatePresence>
    </>
  )
}
