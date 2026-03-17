import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import { graphApi } from '../services/api'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { SLOT_COLORS } from '../components/teammates/constants'
import DriverSearch from '../components/teammates/DriverSearch'
import DriverCard from '../components/teammates/DriverCard'
import FeaturedDrivers from '../components/teammates/FeaturedDrivers'
import HowToSteps from '../components/teammates/HowToSteps'
import ComparisonPanel from '../components/teammates/ComparisonPanel'

export default function TeammateHistoryPage() {
  const { isMobile } = useBreakpoint()
  const [drivers, setDrivers] = useState([])

  const existingIds = drivers.map(d => d.driverId)

  async function addDriver(info) {
    if (existingIds.includes(info.driverId) || drivers.length >= 3) return
    setDrivers(prev => {
      if (prev.find(d => d.driverId === info.driverId) || prev.length >= 3) return prev
      return [...prev, { driverId: info.driverId, name: info.name, color: SLOT_COLORS[prev.length], data: null, loading: true }]
    })
    try {
      const data = await graphApi.getDriverConnections(info.driverId)
      setDrivers(prev => prev.map(d =>
        d.driverId === info.driverId ? { ...d, data, loading: false } : d
      ))
    } catch {
      setDrivers(prev => prev.filter(d => d.driverId !== info.driverId))
    }
  }

  function addPair(infoA, infoB) {
    addDriver(infoA)
    addDriver(infoB)
  }

  function removeDriver(driverId) {
    setDrivers(prev => {
      const next = prev.filter(d => d.driverId !== driverId)
      return next.map((d, i) => ({ ...d, color: SLOT_COLORS[i] }))
    })
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Teammate History"
        subtitle="Explore a driver's full career, teams and teammates · click any name to chain"
        badge="dgraph"
      />

      {/* Search + how-to row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Search Driver
            </span>
            <DriverSearch onAdd={addDriver} disabledIds={existingIds} />
          </div>
          {drivers.length > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1.1rem' }}
            >
              {drivers.length === 1 ? 'Click any teammate chip below to chain them' : `Comparing ${drivers.length} drivers`}
            </motion.span>
          )}
        </div>
        <HowToSteps driverCount={drivers.length} />
      </div>

      {/* Cards or empty state */}
      <AnimatePresence mode="popLayout">
        {drivers.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}>
            {/* Left: driver cards */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {drivers.map(driver => (
                <DriverCard
                  key={driver.driverId}
                  driver={driver}
                  onRemove={() => removeDriver(driver.driverId)}
                  onAddTeammate={tm => addDriver({ driverId: tm.driverId, name: tm.name })}
                  existingIds={existingIds}
                />
              ))}
            </div>
            {/* Right: comparison panel (desktop only) */}
            {!isMobile && (
              <motion.div
                key="comparison"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3 }}
                style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1rem)' }}
              >
                <ComparisonPanel drivers={drivers} />
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FeaturedDrivers onAdd={addDriver} onAddPair={addPair} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
