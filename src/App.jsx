import { lazy, Suspense, Component } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

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

function NotFound() {
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', minHeight: '60vh', textAlign: 'center' }}>
      <p style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--f1-red)', lineHeight: 1 }}>404</p>
      <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Page not found</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>The page you're looking for doesn't exist.</p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn" onClick={() => window.history.back()}>Go back</button>
        <Link to="/" className="btn">Dashboard</Link>
      </div>
    </div>
  )
}
import { TooltipProvider } from '@/components/ui/tooltip'
import Navbar           from './components/layout/Navbar'
import HomePage         from './pages/HomePage'
import EncyclopediaPage from './pages/EncyclopediaPage'
import DriversPage         from './pages/DriversPage'
import DriverProfilePage   from './pages/DriverProfilePage'
import RacesPage        from './pages/RacesPage'
import CircuitsPage     from './pages/CircuitsPage'
import TelemetryPage    from './pages/TelemetryPage'
import StandingsPage             from './pages/StandingsPage'
import ConstructorStandingsPage  from './pages/ConstructorStandingsPage'
import RaceDetailPage            from './pages/RaceDetailPage'
import TeammateHistoryPage       from './pages/TeammateHistoryPage'
import TireStrategyPage          from './pages/TireStrategyPage'
import RacePacePage              from './pages/RacePacePage'
import NextRacePage              from './pages/NextRacePage'
import LivePage                  from './pages/LivePage'
import StandingsSidebar         from './components/standings/StandingsSidebar'

const GraphPage = lazy(() => import('./pages/GraphPage'))

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
      <div className="app">
        <Navbar />
        <StandingsSidebar />
        <ErrorBoundary>
        <Routes>
          <Route path="/"             element={<HomePage />}         />
          <Route path="/encyclopedia" element={<EncyclopediaPage />} />
          <Route path="/drivers"          element={<DriversPage />}        />
          <Route path="/drivers/:id"      element={<DriverProfilePage />}  />
          <Route path="/races"        element={<RacesPage />}        />
          <Route path="/circuits"     element={<CircuitsPage />}     />
          <Route path="/telemetry"    element={<TelemetryPage />}    />
          <Route path="/standings"             element={<StandingsPage />}            />
          <Route path="/constructor-standings" element={<ConstructorStandingsPage />} />
          <Route path="/races/:season/:round" element={<RaceDetailPage />}           />
          <Route path="/teammates"           element={<TeammateHistoryPage />}      />
          <Route path="/tire-strategy"      element={<TireStrategyPage />}         />
          <Route path="/race-pace"          element={<RacePacePage />}             />
          <Route path="/next-race"          element={<NextRacePage />}             />
          <Route path="/live"               element={<LivePage />}                 />
          <Route path="/graph"        element={
            <Suspense fallback={<div className="page"><p>Loading graph...</p></div>}>
              <GraphPage />
            </Suspense>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
      </div>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
