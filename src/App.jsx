import { lazy, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { features } from './config/features'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider }        from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { LiveStatusProvider }  from './contexts/LiveStatusContext'
import AppShell          from './components/layout/AppShell'
import ScrollFade        from './components/ui/ScrollFade'
import HomePage          from './pages/HomePage'
import ConstructorStandingsRedirect from './components/standings/ConstructorStandingsRedirect'

const DriversTeamsPage         = lazy(() => import('./pages/DriversTeamsPage'))
const DriverProfilePage        = lazy(() => import('./pages/DriverProfilePage'))
const ConstructorProfilePage   = lazy(() => import('./pages/ConstructorProfilePage'))
const RaceWeekendPage          = lazy(() => import('./pages/RaceWeekendPage'))
const CircuitsPage             = lazy(() => import('./pages/CircuitsPage'))
const CircuitDetailPage        = lazy(() => import('./pages/CircuitDetailPage'))
const RaceAnalysisPage         = lazy(() => import('./pages/RaceAnalysisPage'))
const StandingsPage            = lazy(() => import('./pages/StandingsPage'))
const TeammateHistoryPage      = lazy(() => import('./pages/TeammateHistoryPage'))
const NextRaceRedirect         = lazy(() => import('./components/race/NextRaceRedirect'))
const LegacyRedirect           = lazy(() => import('./components/layout/LegacyRedirect'))
const CalendarPage             = lazy(() => import('./pages/CalendarPage'))
const LivePage                 = lazy(() => import('./pages/LivePage'))
const NotFoundPage             = lazy(() => import('./pages/NotFoundPage'))
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
            <Route path="/encyclopedia"          element={<LegacyRedirect />}          />
            <Route path="/drivers"               element={<DriversTeamsPage />}        />
            <Route path="/drivers/:id"           element={<DriverProfilePage />}       />
            <Route path="/constructors/:constructorId" element={<ConstructorProfilePage />} />
            <Route path="/races"                 element={<LegacyRedirect />}          />
            <Route path="/races/:season/:round"  element={<RaceWeekendPage />}         />
            <Route path="/calendar"              element={<CalendarPage />}            />
            <Route path="/circuits"              element={<CircuitsPage />}            />
            <Route path="/circuits/:circuitId"   element={<CircuitDetailPage />}       />
            <Route path="/analysis"              element={<RaceAnalysisPage />}        />
            <Route path="/telemetry"             element={<LegacyRedirect />}          />
            <Route path="/standings"             element={<StandingsPage />}           />
            <Route path="/constructor-standings" element={<ConstructorStandingsRedirect />}/>
            <Route path="/teammates"             element={<TeammateHistoryPage />}     />
            <Route path="/tire-strategy"         element={<LegacyRedirect />}          />
            <Route path="/race-pace"             element={<LegacyRedirect />}          />
            <Route path="/next-race"             element={<NextRaceRedirect />}        />
            <Route path="/live"                  element={features.liveTiming ? <LivePage /> : <Navigate to="/" replace />} />
            <Route path="/graph"                 element={<LegacyRedirect />}          />
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
