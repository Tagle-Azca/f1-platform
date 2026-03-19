import { lazy, Suspense, Component, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import Navbar                    from './components/layout/Navbar'
import StandingsSidebar          from './components/standings/StandingsSidebar'
import HomePage                  from './pages/HomePage'
import EncyclopediaPage          from './pages/EncyclopediaPage'
import DriversPage               from './pages/DriversPage'
import DriverProfilePage         from './pages/DriverProfilePage'
import RacesPage                 from './pages/RacesPage'
import CircuitsPage              from './pages/CircuitsPage'
import TelemetryPage             from './pages/TelemetryPage'
import StandingsPage             from './pages/StandingsPage'
import ConstructorStandingsPage  from './pages/ConstructorStandingsPage'
import RaceDetailPage            from './pages/RaceDetailPage'
import TeammateHistoryPage       from './pages/TeammateHistoryPage'
import TireStrategyPage          from './pages/TireStrategyPage'
import RacePacePage              from './pages/RacePacePage'
import NextRacePage              from './pages/NextRacePage'
import LivePage                  from './pages/LivePage'
import NotFoundPage              from './pages/NotFoundPage'

const GraphPage = lazy(() => import('./pages/GraphPage'))

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
    const ping = () => {
      if (document.visibilityState === 'visible')
        fetch(`${import.meta.env.VITE_API_URL}/health`).catch(() => {})
    }
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
              <Route path="/graph" element={
                <Suspense fallback={<div className="page"><p>Loading graph...</p></div>}>
                  <GraphPage />
                </Suspense>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </TooltipProvider>
    </BrowserRouter>
    <Analytics />
  </>)
}

export default App
