import { Component, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import RaceContextBar from './RaceContextBar'
import StandingsSidebar from '../standings/StandingsSidebar'
import ShellBoundary from './ShellBoundary'
import { RaceProvider } from '../../contexts/RaceContext'

const Fallback = () => <div className="page min-h-[60vh]" aria-busy="true" />

class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidUpdate(prevProps) {
    if (this.state.failed && prevProps.location !== this.props.location) this.setState({ failed: false })
  }
  render() {
    if (!this.state.failed) return this.props.children
    // Static copy only: raw error messages and stacks are never rendered (SECURE mode).
    return <ErrorView onRetry={() => this.setState({ failed: false })} />
  }
}

/** Plain-copy error page. `data-error-boundary` is the stable selector tests rely on (never the copy). */
function ErrorView({ onRetry }) {
  const navigate = useNavigate()
  return (
    <div role="alert" data-error-boundary className="page flex min-h-[70vh] flex-col items-start justify-center gap-pw-4">
      <span className="inline-flex min-h-8 items-center gap-pw-2 rounded-pill bg-live-soft px-pw-3 text-xs font-semibold text-ink">
        <Flag aria-hidden="true" className="size-3.5 text-live" />
        Red flag
      </span>
      <h1 className="text-title text-ink">Something went wrong</h1>
      <p className="max-w-md text-base text-ink-2">This page failed to load. Try again, or go back to the dashboard.</p>
      <div className="flex flex-wrap gap-pw-2">
        <button type="button" className="btn btn--primary btn--sentence" onClick={onRetry}>Try again</button>
        <button type="button" className="btn btn--ghost btn--sentence" onClick={() => { onRetry(); navigate('/') }}>Dashboard</button>
      </div>
    </div>
  )
}

function LocationBoundary({ children }) {
  const location = useLocation()
  return <ErrorBoundary location={location}>{children}</ErrorBoundary>
}

/**
 * App shell: skip link, Sidebar (md+) | header + main | standings rail (xl+), MobileNav (<md).
 * DOM order = keyboard order: skip link, nav, header, main, rail, mobile nav.
 * `children` is the <Routes> table (kept in App.jsx so route paths stay in one place).
 */
export default function AppShell({ children }) {
  const { pathname } = useLocation()
  return (
    <MotionConfig reducedMotion="user">
      <RaceProvider>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="app min-h-dvh bg-bg">
        <ShellBoundary resetKey={pathname}><Sidebar /></ShellBoundary>
        <div className="flex-1 min-w-0 flex flex-col">
          <ShellBoundary resetKey={pathname}><RaceContextBar /></ShellBoundary>
          <main
            id="main"
            tabIndex={-1}
            className="flex-1 flex flex-col outline-none pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom))] md:pb-0"
          >
            <LocationBoundary>
              <Suspense fallback={<Fallback />}>{children}</Suspense>
            </LocationBoundary>
          </main>
        </div>
        <StandingsSidebar />
        <ShellBoundary resetKey={pathname}><MobileNav /></ShellBoundary>
      </div>
      </RaceProvider>
    </MotionConfig>
  )
}
