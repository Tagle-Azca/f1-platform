import HomeHero from '../home/HomeHero'
import LiveConsoleDashboard from '../home/LiveConsoleDashboard'
import TitleFightCard from '../home/TitleFightCard'
import LastSessionPanel from '../home/LastSessionPanel'
import LiveRacePanel from '../home/LiveRacePanel'
import HomeStandingsPanel from '../home/HomeStandingsPanel'
import GoDeeperPanel from '../home/GoDeeperPanel'

/**
 * Dashboard widget components. Each receives one `ctx` object from HomePage:
 * { data, loading, error, onRetry, liveData, tower, standingsTab, onTabChange, onDriverClick, onConstructorClick }
 * A widget fails independently: it renders its own error panel, the others keep working.
 */
export const HeroWidget = ({ ctx }) => (
  <HomeHero race={ctx.data?.nextRace ?? null} loading={ctx.loading} error={ctx.error} onRetry={ctx.onRetry} />
)

export const LiveConsoleWidget = ({ ctx }) => (ctx.tower && !ctx.tower.completed ? <LiveConsoleDashboard tower={ctx.tower} /> : null)

export const TitleFightWidget = ({ ctx }) => (
  <TitleFightCard data={ctx.data} loading={ctx.loading} error={ctx.error} onRetry={ctx.onRetry} />
)

export const LastSessionWidget = ({ ctx }) => (
  ctx.liveData
    ? <LiveRacePanel live={ctx.liveData} />
    : <LastSessionPanel session={ctx.data?.lastSession} loading={ctx.loading} error={ctx.error} onRetry={ctx.onRetry} onDriverClick={ctx.onDriverClick} />
)

export const StandingsWidget = ({ ctx }) => (
  <HomeStandingsPanel
    data={ctx.data} loading={ctx.loading} error={ctx.error} onRetry={ctx.onRetry}
    standingsTab={ctx.standingsTab} onTabChange={ctx.onTabChange}
    onDriverClick={ctx.onDriverClick} onConstructorClick={ctx.onConstructorClick}
  />
)

export const GoDeeperWidget = () => <GoDeeperPanel />
