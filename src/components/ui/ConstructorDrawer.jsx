import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import TeamMark from '../profiles/TeamMark'
import { DriverLink, RetryButton } from '../profiles/ProfileLinks'
import { isValidEntityId } from '../profiles/entityId'
import { teamIdentity, kpis, latestDrivers } from '../profiles/constructor/constructorProfileModel'
import { useConstructorProfile } from '../../hooks/useConstructorProfile'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { buttonVariants } from './button-variants'
import { DUR, EASE_OUT, useReducedMotion } from '../../styles/motion'
import { cn } from '@/lib/utils'

function Body({ id, name }) {
  const { status, data, retry } = useConstructorProfile(id)
  const k = status === 'ready' ? kpis(data?.stats) : { primary: [] }
  const { season, drivers } = status === 'ready' ? latestDrivers(data?.seasons) : { season: null, drivers: [] }
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-pw-4 py-pw-4" aria-busy={status === 'loading' || undefined}>
      {status === 'loading' && (
        <>
          <div aria-hidden="true" className="flex flex-col gap-pw-4">
            <div className="grid grid-cols-2 gap-px bg-edge-soft sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="flex flex-col gap-pw-2 bg-panel p-pw-3"><div className="viz-pulse h-8 w-10 rounded-[2px] bg-edge-soft" /><div className="viz-pulse h-3 w-12 rounded-[2px] bg-edge-soft" /></div>)}
            </div>
            {[0, 1].map((i) => <div key={i} className="viz-pulse h-12 rounded-[2px] bg-edge-soft" />)}
          </div>
          <span role="status" className="sr-only">Loading {name}</span>
        </>
      )}
      {status === 'error' && (
        <div role="alert" className="flex flex-wrap items-center gap-x-pw-4">
          <p className="text-sm text-ink-2">We couldn&apos;t load this team.</p>
          <RetryButton onClick={retry} />
        </div>
      )}
      {status === 'notFound' && <p className="text-sm text-ink-2">No profile for this team in Pitwall data.</p>}
      {status === 'ready' && (
        <>
          <p className="text-xs text-ink-3">Since 2022</p>
          <dl className="m-0 mt-pw-2 grid grid-cols-2 gap-px bg-edge-soft sm:grid-cols-4" data-drawer-kpis>
            {k.primary.map((p) => (
              <div key={p.key} className="flex flex-col bg-panel px-pw-3 py-pw-2">
                <dd className="order-1 m-0 text-stat text-ink">{p.value}</dd>
                <dt className="order-2 text-xs text-ink-3">{p.label}</dt>
              </div>
            ))}
          </dl>
          {drivers.length > 0 && (
            <>
              <p className="mt-pw-5 text-xs text-ink-3">{season} drivers</p>
              <ul className="mt-pw-1 flex flex-col divide-y divide-edge-soft">
                {drivers.map((d) => (
                  <li key={d.id || d.name} className="flex min-h-12 items-center justify-between gap-pw-3">
                    <DriverLink id={d.id} className="min-w-0 truncate">{d.name}</DriverLink>
                    <span className="num text-ink-2">{d.points} pts</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Slim constructor summary (420px): header, season position and points when the caller has them, four totals since
 * 2022, the latest drivers and an "Open full profile" link. Details live on /constructors/:id; the profile request is
 * shared with that page through the same cache.
 * `constructor` is { constructorId, name, season?, position?, points? }.
 */
export default function ConstructorDrawer({ constructor: ctor, onClose }) {
  const containerRef = useFocusTrap(!!ctor, onClose)
  const reduced = useReducedMotion()
  const id = ctor?.constructorId
  const canOpen = isValidEntityId(id)
  const hasSeason = Number.isFinite(ctor?.season) && Number.isFinite(ctor?.position) && Number.isFinite(ctor?.points)
  const identity = teamIdentity(canOpen ? id : '', ctor?.name)
  const slide = reduced
    ? { initial: false, exit: { opacity: 0, transition: { duration: 0 } } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' }, transition: { duration: DUR.base, ease: EASE_OUT } }
  return (
    <AnimatePresence>
      {ctor && (
        <>
          <motion.div
            key="backdrop" aria-hidden="true"
            initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : DUR.fast }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-bg/70"
          />
          <motion.aside
            key="drawer" ref={containerRef}
            role="dialog" aria-modal="true" aria-labelledby="ctor-drawer-title" tabIndex={-1}
            {...slide}
            className="fixed inset-y-0 right-0 z-[201] flex w-[min(420px,100dvw)] flex-col border-l border-edge bg-panel shadow-float outline-none"
          >
            <div className="flex min-h-16 items-center gap-pw-3 border-b border-edge-soft px-pw-4">
              <TeamMark code={identity.code} color={identity.color} well className="h-8 w-10 shrink-0" />
              <h2 id="ctor-drawer-title" className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-ink">{ctor.name}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-ink-2 hover:bg-hover hover:text-ink">
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            {hasSeason && (
              <div className="border-b border-edge-soft px-pw-4 py-pw-3">
                <p className="text-xs text-ink-3">{ctor.season} season</p>
                <p className="num text-[15px] font-medium text-ink">P{ctor.position} · {ctor.points} points</p>
              </div>
            )}
            <Body key={id} id={id} name={ctor.name} />
            {canOpen && (
              <div className="border-t border-edge-soft p-pw-4">
                <Link to={`/constructors/${id}`} onClick={onClose} className={cn(buttonVariants({ size: 'lg' }), 'w-full no-underline')}>Open full profile</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
