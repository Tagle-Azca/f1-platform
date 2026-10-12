import { useId } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getVisibleGroups } from '../../config/navConfig'
import { useLiveStatus } from '../../contexts/LiveStatusContext'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'

/** One nav link. aria-current="page" is set by NavLink when active. */
function NavItem({ item, onNavigate, barId }) {
  const reduced = useReducedMotion()
  const location = useLocation()
  const navigate = useNavigate()
  const { available: liveAvailable } = useLiveStatus() ?? {}
  const { path, label, icon: Icon } = item
  const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  const showLive = item.live && liveAvailable

  return (
    <NavLink
      to={path}
      end={path === '/'}
      onClick={() => {
        onNavigate?.()
        if (isActive) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          navigate(path, { state: { reset: Date.now() } })
        }
      }}
      className={({ isActive: a }) => [
        'relative flex items-center gap-pw-3 min-h-11 md:min-h-10 px-pw-3 rounded-md no-underline text-base transition-colors duration-[120ms]',
        a ? 'bg-steel-soft text-ink font-semibold' : 'text-ink-2 font-medium [@media(hover:hover)]:hover:bg-hover [@media(hover:hover)]:hover:text-ink',
      ].join(' ')}
    >
      {({ isActive: a }) => (
        <>
          {a && (
            <motion.span
              layoutId={barId}
              aria-hidden="true"
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-pill bg-steel"
              transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_OUT }}
            />
          )}
          {Icon && <Icon aria-hidden="true" className="size-5 shrink-0" />}
          <span className="flex-1 min-w-0 truncate">{label}</span>
          {showLive && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink">
              <span aria-hidden="true" className="size-2 rounded-full bg-live" />
              Live
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/** The 4 nav groups from navConfig (feature-flagged items filtered out). */
export default function NavList({ onNavigate }) {
  const barId = `nav-bar-${useId()}`
  return (
    <div className="flex flex-col gap-pw-4">
      {getVisibleGroups().map(group => (
        <div key={group.label}>
          <h2 className="px-pw-3 pb-pw-1 font-sans text-xs font-medium leading-4 text-ink-3">{group.label}</h2>
          <ul className="flex flex-col gap-0.5 list-none">
            {group.items.map(item => (
              <li key={item.path}><NavItem item={item} onNavigate={onNavigate} barId={barId} /></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
