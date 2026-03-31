import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import EmptyState from '../ui/EmptyState'
import ResultRow from '../ui/ResultRow'
import TabBar from '../ui/TabBar'
import { ctorColor } from '../../utils/teamColors'

const STANDINGS_TABS = [{ id: 'drivers', label: 'Drivers' }, { id: 'constructors', label: 'Constructors' }]

export default function HomeStandingsPanel({ data, loading, standingsTab, onTabChange, onDriverClick, onConstructorClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Panel accent="accent" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <TabBar
              tabs={STANDINGS_TABS}
              activeTab={standingsTab}
              onChange={onTabChange}
              variant="pill"
              accentColor="var(--accent-color)"
            />
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-color)', opacity: 0.7, marginTop: '0.25rem', transition: 'color 0.4s' }}>
              Click a row for detailed profile
            </div>
          </div>
          {data && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
              {data.roundsDone}/{data.totalRounds} rds
            </span>
          )}
        </div>

        {loading ? (
          <EmptyState type="loading" height={80} />
        ) : standingsTab === 'drivers' ? (
          !data?.standings?.length ? (
            <EmptyState type="empty" message="No data yet" height={80} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.standings.slice(0, 5).map((driver, i) => (
                <ResultRow
                  key={driver.driverId}
                  position={driver.position}
                  name={driver.name}
                  sub={driver.team}
                  stat={driver.points}
                  color={ctorColor(driver.constructorId)}
                  isLeader={i === 0}
                  showChevron
                  onClick={() => onDriverClick({ driverId: driver.driverId, name: driver.name })}
                />
              ))}
            </div>
          )
        ) : (
          !data?.constructorStandings?.length ? (
            <EmptyState type="empty" message="No data yet" height={80} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.constructorStandings.slice(0, 5).map((ctor, i) => (
                <ResultRow
                  key={ctor.constructorId}
                  position={ctor.position}
                  name={ctor.name}
                  stat={ctor.points}
                  color={ctorColor(ctor.constructorId)}
                  isLeader={i === 0}
                  showChevron
                  onClick={() => onConstructorClick({ constructorId: ctor.constructorId, name: ctor.name })}
                />
              ))}
            </div>
          )
        )}

        <Link
          to={standingsTab === 'drivers' ? '/standings' : '/constructor-standings'}
          style={{
            alignSelf: 'flex-end', fontSize: '0.75rem', color: 'var(--accent-color)',
            textDecoration: 'none', letterSpacing: '0.06em', fontWeight: 600,
            fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase',
          }}
        >
          Full standings →
        </Link>
      </Panel>
    </motion.div>
  )
}
