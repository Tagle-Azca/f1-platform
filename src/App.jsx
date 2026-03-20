import { lazy, Suspense, Component, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import Navbar           from './components/layout/Navbar'
import StandingsSidebar from './components/standings/StandingsSidebar'
import ScrollFade       from './components/ui/ScrollFade'
import HomePage         from './pages/HomePage'

const EncyclopediaPage         = lazy(() => import('./pages/EncyclopediaPage'))
const DriversPage              = lazy(() => import('./pages/DriversPage'))
const DriverProfilePage        = lazy(() => import('./pages/DriverProfilePage'))
const RacesPage                = lazy(() => import('./pages/RacesPage'))
const RaceDetailPage           = lazy(() => import('./pages/RaceDetailPage'))
const CircuitsPage             = lazy(() => import('./pages/CircuitsPage'))
const TelemetryPage            = lazy(() => import('./pages/TelemetryPage'))
const StandingsPage            = lazy(() => import('./pages/StandingsPage'))
const ConstructorStandingsPage = lazy(() => import('./pages/ConstructorStandingsPage'))
const TeammateHistoryPage      = lazy(() => import('./pages/TeammateHistoryPage'))
const TireStrategyPage         = lazy(() => import('./pages/TireStrategyPage'))
const RacePacePage             = lazy(() => import('./pages/RacePacePage'))
const NextRacePage             = lazy(() => import('./pages/NextRacePage'))
const LivePage                 = lazy(() => import('./pages/LivePage'))
const NotFoundPage             = lazy(() => import('./pages/NotFoundPage'))
const GraphPage                = lazy(() => import('./pages/GraphPage'))

const fallback = <div className="page" style={{ minHeight: '60vh' }} />

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', minHeight: '70vh', textAlign: 'center' }}>
        {/* Red flag icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" style={{ width: 56, height: 56, opacity: 0.9 }}>
          <rect x="10" y="8" width="4" height="48" rx="2" fill="var(--text-muted)" />
          <rect x="14" y="8" width="36" height="22" rx="2" fill="#e10600" />
          <rect x="14" y="8"  width="12" height="11" fill="#c00" />
          <rect x="26" y="19" width="12" height="11" fill="#c00" />
          <rect x="38" y="8"  width="12" height="11" fill="#c00" />
        </svg>

        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2rem', fontWeight: 900, letterSpacing: '0.08em', color: '#e10600', textTransform: 'uppercase', lineHeight: 1 }}>
            Red Flag
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', marginTop: '0.3rem', textTransform: 'uppercase' }}>
            Stewards are investigating a technical incident
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 320 }}>
          The pit wall is on it. Service will resume shortly — try again in a moment.
        </p>

        <button className="btn" onClick={() => this.setState({ error: null })}>
          Back to the pits
        </button>
      </div>
    )
  }
}

function App() {
  useEffect(() => {
    const ping = () => fetch(`${import.meta.env.VITE_API_URL}/health`).catch(() => {})
    ping()
    const id = setInterval(ping, 13 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (<>
    <BrowserRouter>
      <TooltipProvider>
        <div className="app">
          <Navbar />
          <StandingsSidebar />
          <ErrorBoundary>
            <Suspense fallback={fallback}>
              <Routes>
                <Route path="/"                      element={<HomePage />}                />
                <Route path="/encyclopedia"          element={<EncyclopediaPage />}        />
                <Route path="/drivers"               element={<DriversPage />}             />
                <Route path="/drivers/:id"           element={<DriverProfilePage />}       />
                <Route path="/races"                 element={<RacesPage />}               />
                <Route path="/races/:season/:round"  element={<RaceDetailPage />}          />
                <Route path="/circuits"              element={<CircuitsPage />}            />
                <Route path="/telemetry"             element={<TelemetryPage />}           />
                <Route path="/standings"             element={<StandingsPage />}           />
                <Route path="/constructor-standings" element={<ConstructorStandingsPage />}/>
                <Route path="/teammates"             element={<TeammateHistoryPage />}     />
                <Route path="/tire-strategy"         element={<TireStrategyPage />}        />
                <Route path="/race-pace"             element={<RacePacePage />}            />
                <Route path="/next-race"             element={<NextRacePage />}            />
                <Route path="/live"                  element={<LivePage />}                />
                <Route path="/graph"                 element={<GraphPage />}               />
                <Route path="*"                      element={<NotFoundPage />}            />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </TooltipProvider>
    </BrowserRouter>
    <ScrollFade />
    <Analytics />
  </>)
}

export default App
