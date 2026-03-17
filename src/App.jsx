import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
        </Routes>
      </div>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App
