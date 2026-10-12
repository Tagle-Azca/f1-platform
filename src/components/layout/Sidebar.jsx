import NavList from './NavList'
import GuestProfile from '../auth/GuestProfile'

export function Brand() {
  return (
    <div className="flex items-center gap-pw-3 px-pw-5 pt-pw-5 pb-pw-4">
      <img src="/favicon.png" alt="" width="32" height="32" className="size-8" />
      <div>
        <p className="font-display text-lg leading-[1.2] tracking-[-0.01em] text-ink">
          <span className="block font-bold">Pitwall</span><span className="block font-medium text-ink-2">Intelligence</span>
        </p>
        <p className="text-xs text-ink-3 mt-1">Every lap, every era</p>
      </div>
    </div>
  )
}

/** Desktop/tablet (>=768px) navigation. Hidden below md; mobile uses MobileNav. */
export default function Sidebar() {
  return (
    // The wrapper stretches with the page and carries the fill; the sticky inner keeps the nav in view.
    <div className="hidden md:block shrink-0 w-sidebar bg-sidebar border-r border-edge-soft z-40">
      <aside className="sticky top-0 flex h-dvh flex-col">
        <Brand />
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-pw-3 pb-pw-3">
          <NavList />
        </nav>
        <div className="p-pw-3">
          <GuestProfile />
        </div>
      </aside>
    </div>
  )
}
