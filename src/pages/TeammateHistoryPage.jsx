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
import ComparisonPanel from '../components/teammates/ComparisonPanel'
import VSHeroSlots from '../components/teammates/VSHeroSlots'

export default function TeammateHistoryPage() {
  const { isMobile } = useBreakpoint()
  const [drivers, setDrivers] = useState([])

  const existingIds = drivers.map(d => d.driverId)

  async function addDriver(info) {
    if (existingIds.includes(info.driverId) || drivers.length >= 2) return
    setDrivers(prev => {
      if (prev.find(d => d.driverId === info.driverId) || prev.length >= 2) return prev
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

  async function addPair(infoA, infoB) {
    setDrivers([
      { driverId: infoA.driverId, name: infoA.name, color: SLOT_COLORS[0], data: null, loading: true },
      { driverId: infoB.driverId, name: infoB.name, color: SLOT_COLORS[1], data: null, loading: true },
    ])
    const [resA, resB] = await Promise.allSettled([
      graphApi.getDriverConnections(infoA.driverId),
      graphApi.getDriverConnections(infoB.driverId),
    ])
    setDrivers(prev => prev.map(d => {
      if (d.driverId === infoA.driverId)
        return resA.status === 'fulfilled' ? { ...d, data: resA.value, loading: false } : null
      if (d.driverId === infoB.driverId)
        return resB.status === 'fulfilled' ? { ...d, data: resB.value, loading: false } : null
      return d
    }).filter(Boolean))
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
        title="Rivalries"
        subtitle="Explore career overlaps and performance deltas. Compare teammate history or simulate legendary matchups across different eras."
        badge="dgraph"
      />

      {/* ── VS Hero Slots ── */}
      <VSHeroSlots drivers={drivers} onRemove={removeDriver} isMobile={isMobile} />

      {/* ── Contextual hint — fades between states ── */}
      <AnimatePresence mode="wait">
        {drivers.length === 0 && (
          <motion.p
            key="hint-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, margin: '0 0 1.5rem', lineHeight: 1.5 }}
          >
            Select a driver to start the analysis.
          </motion.p>
        )}
        {drivers.length === 1 && (
          <motion.p
            key="hint-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, margin: '0 0 1.5rem', lineHeight: 1.5 }}
          >
            Now choose a teammate or any rival to calculate the comparison.
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Comparison Panel — visible immediately when both slots filled ── */}
      <AnimatePresence>
        {drivers.length >= 2 && (
          <motion.div
            key="comparison-hero"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ marginBottom: '2rem' }}
          >
            <ComparisonPanel drivers={drivers} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search ── */}
      <div style={{ marginBottom: '2.5rem', maxWidth: 520 }}>
        <DriverSearch
          onAdd={addDriver}
          disabledIds={existingIds}
          disabled={drivers.length >= 2}
        />
      </div>

      {/* ── Featured Drivers + Rivalries — always visible ── */}
      <FeaturedDrivers
        onAdd={addDriver}
        onAddPair={addPair}
        drivers={drivers}
        disabledIds={existingIds}
        isMobile={isMobile}
      />

      {/* ── Career Networks — for deeper exploration ── */}
      <AnimatePresence>
        {drivers.length > 0 && (
          <motion.div
            key="networks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: '3rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '2rem',
            }}
          >
            <div style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              marginBottom: '1rem',
            }}>
              Career Networks
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
