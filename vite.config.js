import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['recharts'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text'],
      // Core code touched by the UI/UX pass. Excluded: CircuitRadarCanvas (canvas + rAF loop, not
      // meaningful in jsdom; no logic besides drawing), and legacy pages only edited for a11y/mobile.
      include: [
        'src/config/**', 'src/utils/{safeUrl,safeArray,safeText,eta,sessionWhen,normalizeDashboard,sessionSchedule}.js', 'src/hooks/{useMediaQuery,useNow,useStatusAnnouncer,useRaceContext}.js',
        'src/contexts/{RaceContext.jsx,raceContextStore.js}', 'src/components/dashboard/**', 'src/components/live/**',
        'src/components/layout/**', 'src/components/standings/StandingsSidebar.jsx',
        'src/components/home/{TitleFightCard,LastSessionPanel,GoDeeperPanel,HomeHero,HomeStandingsPanel,LiveRacePanel,HomeFooter,LiveConsoleDashboard,LiveTelemetryStrip}.jsx',
        'src/components/nextrace/**', 'src/components/auth/{LoginModal,AuthField,AuthInput,AuthError,AuthDivider,TelemetrySelect,GuestProfile}.jsx',
        'src/components/ui/{Panel,SectionHeader,DataRow,StatLine,Disclosure,Meter,TyreBadge,StatCard,TabBar,LivePill,CountdownDisplay,EmptyState,BackendError}.jsx',
        'src/pages/{HomePage,LivePage,NextRacePage,StandingsPage}.jsx', 'src/components/standings/**', 'src/hooks/{useReplay,useTweenedNumber,useStandingsData}.js', 'src/components/ui/SegmentedControl.jsx', 'src/components/ui/ConstructorDrawer.jsx', 'src/components/encyclopedia/**', 'src/components/profiles/**', 'src/hooks/{useDriverProfile,useConstructorProfile,useTeammateH2H,useSeasonCircuits,entityLoader}.js', 'src/pages/{EncyclopediaPage,DriverProfilePage,ConstructorProfilePage}.jsx', 'src/components/viz/**', 'src/styles/{vizPalette,motion,chartTheme}.js',
      ],
      // ConnectionsCanvas: canvas drawing + a force simulation (no logic besides painting), checked in the browser spec like CircuitRadarCanvas.
      exclude: ['**/*.test.*', 'src/components/profiles/ConnectionsCanvas.jsx'],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', '.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:8741',
        changeOrigin: true,
      },
    },
  },
})