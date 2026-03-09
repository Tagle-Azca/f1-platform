import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar           from './components/layout/Navbar'
import HomePage         from './pages/HomePage'
import EncyclopediaPage from './pages/EncyclopediaPage'
import DriversPage      from './pages/DriversPage'
import RacesPage        from './pages/RacesPage'
import CircuitsPage     from './pages/CircuitsPage'
import TelemetryPage    from './pages/TelemetryPage'
import StandingsPage    from './pages/StandingsPage'

const GraphPage = lazy(() => import('./pages/GraphPage'))

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/"             element={<HomePage />}         />
          <Route path="/encyclopedia" element={<EncyclopediaPage />} />
          <Route path="/drivers"      element={<DriversPage />}      />
          <Route path="/races"        element={<RacesPage />}        />
          <Route path="/circuits"     element={<CircuitsPage />}     />
          <Route path="/telemetry"    element={<TelemetryPage />}    />
          <Route path="/standings"    element={<StandingsPage />}    />
          <Route path="/graph"        element={
            <Suspense fallback={<div className="page"><p>Loading graph...</p></div>}>
              <GraphPage />
            </Suspense>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
