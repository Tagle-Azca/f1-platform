import { lazy, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider }        from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { LiveStatusProvider }  from './contexts/LiveStatusContext'
import AppShell          from './components/layout/AppShell'
import ScrollFade        from './components/ui/ScrollFade'
import HomePage          from './pages/HomePage'
import ConstructorStandingsRedirect from './components/standings/ConstructorStandingsRedirect'

const EncyclopediaPage         = lazy(() => import('./pages/EncyclopediaPage'))
const DriversPage              = lazy(() => import('./pages/DriversPage'))
const DriverProfilePage        = lazy(() => import('./pages/DriverProfilePage'))
const ConstructorProfilePage   = lazy(() => import('./pages/ConstructorProfilePage'))
const RacesPage                = lazy(() => import('./pages/RacesPage'))
const RaceDetailPage           = lazy(() => import('./pages/RaceDetailPage'))
const CircuitsPage             = lazy(() => import('./pages/CircuitsPage'))
const CircuitDetailPage        = lazy(() => import('./pages/CircuitDetailPage'))
const TelemetryPage            = lazy(() => import('./pages/TelemetryPage'))
const StandingsPage            = lazy(() => import('./pages/StandingsPage'))
const TeammateHistoryPage      = lazy(() => import('./pages/TeammateHistoryPage'))
const TireStrategyPage         = lazy(() => import('./pages/TireStrategyPage'))
const RacePacePage             = lazy(() => import('./pages/RacePacePage'))
const NextRacePage             = lazy(() => import('./pages/NextRacePage'))
const LivePage                 = lazy(() => import('./pages/LivePage'))
const NotFoundPage             = lazy(() => import('./pages/NotFoundPage'))
const GraphPage                = lazy(() => import('./pages/GraphPage'))
const RegisterPage             = lazy(() => import('./pages/RegisterPage'))

function App() {
  useEffect(() => {
    const ping = () => fetch(`${import.meta.env.VITE_API_URL}/health`).catch(() => {})
    ping()
    const id = setInterval(ping, 13 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (<>
    <BrowserRouter>
      <AuthProvider>
      <PreferencesProvider>
      <LiveStatusProvider>
      <TooltipProvider>
        <AppShell>
          <Routes>
            <Route path="/"                      element={<HomePage />}                />
            <Route path="/encyclopedia"          element={<EncyclopediaPage />}        />
            <Route path="/drivers"               element={<DriversPage />}             />
            <Route path="/drivers/:id"           element={<DriverProfilePage />}       />
            <Route path="/constructors/:constructorId" element={<ConstructorProfilePage />} />
            <Route path="/races"                 element={<RacesPage />}               />
            <Route path="/races/:season/:round"  element={<RaceDetailPage />}          />
            <Route path="/circuits"              element={<CircuitsPage />}            />
            <Route path="/circuits/:circuitId"   element={<CircuitDetailPage />}       />
            <Route path="/telemetry"             element={<TelemetryPage />}           />
            <Route path="/standings"             element={<StandingsPage />}           />
            <Route path="/constructor-standings" element={<ConstructorStandingsRedirect />}/>
            <Route path="/teammates"             element={<TeammateHistoryPage />}     />
            <Route path="/tire-strategy"         element={<TireStrategyPage />}        />
            <Route path="/race-pace"             element={<RacePacePage />}            />
            <Route path="/next-race"             element={<NextRacePage />}            />
            <Route path="/live"                  element={<LivePage />}                />
            <Route path="/graph"                 element={<GraphPage />}               />
            <Route path="/register"              element={<RegisterPage />}            />
            <Route path="*"                      element={<NotFoundPage />}            />
          </Routes>
        </AppShell>
      </TooltipProvider>
      </LiveStatusProvider>
      </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
    <ScrollFade />
    <Analytics />
  </>)
}

export default App
