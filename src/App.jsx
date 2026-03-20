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
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '60vh' }}>
        <p style={{ color: 'var(--f1-red)', fontWeight: 700 }}>Something went wrong</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{this.state.error.message}</p>
        <button className="btn" onClick={() => this.setState({ error: null })}>Try again</button>
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
