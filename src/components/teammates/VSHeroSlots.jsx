import { motion, AnimatePresence } from 'framer-motion'
import { SLOT_COLORS } from './constants'

const pulseKeyframes = `
@keyframes slot-b-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(39,244,210,0); border-color: rgba(39,244,210,0.35); }
  50%       { box-shadow: 0 0 0 10px rgba(39,244,210,0.08); border-color: rgba(39,244,210,0.75); }
}
.slot-b-pulse { animation: slot-b-pulse 2s ease-in-out infinite; }
`

function SlotBox({ driver, slot, onRemove, pulse, isMobile }) {
  const color = SLOT_COLORS[slot]
  const isEmpty = !driver

  return (
    <motion.div
      layout
      className={pulse ? 'slot-b-pulse' : undefined}
      onClick={driver ? onRemove : undefined}
      style={{
        flex: 1,
        minHeight: isMobile ? 68 : 82,
        border: `2px solid ${isEmpty ? 'rgba(255,255,255,0.1)' : color}`,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.25rem',
        background: isEmpty ? 'rgba(38, 38, 38, 0.64)' : `${color}2a`,
        cursor: driver ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.25s, background 0.25s',
      }}
      whileHover={driver ? { scale: 1.015 } : undefined}
      whileTap={driver ? { scale: 0.98 } : undefined}
    >
      {/* Background accent stripe */}
      {driver && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: color, borderRadius: '14px 0 0 14px',
        }} />
      )}

      <AnimatePresence mode="wait">
        {driver ? (
          <motion.div
            key={driver.driverId}
            initial={{ opacity: 0, x: slot === 0 ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slot === 0 ? -24 : 24 }}
            transition={{ duration: 0.22 }}
            style={{ paddingLeft: driver ? '0.75rem' : 0, width: '100%' }}
          >
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: isMobile ? '1.1rem' : '1.9rem',
              fontWeight: 900,
              color,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {driver.name.split(' ').slice(-1)[0]}
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.35)',
              marginTop: '0.2rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              {driver.name.split(' ').slice(0, -1).join(' ')} · tap to remove
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.78)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {slot === 0 ? (isMobile ? 'Pick a driver below' : 'Click a driver below or search one') : 'Select Rival'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function VSHeroSlots({ drivers, onRemove, isMobile }) {
  const slotA = drivers[0] || null
  const slotB = drivers[1] || null
  const pulseB = !!slotA && !slotB

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.65rem' : '1rem',
        marginBottom: '1.75rem',
      }}>
        <SlotBox driver={slotA} slot={0} onRemove={() => onRemove(slotA?.driverId)} isMobile={isMobile} />

        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: isMobile ? '1.4rem' : '1.85rem',
          fontWeight: 900,
          color: slotA && slotB ? 'rgba(255,255,255,0.55)' : 'rgba(255, 255, 255, 0.55)',
          letterSpacing: '0.05em',
          flexShrink: 0,
          transition: 'color 0.3s',
        }}>
          VS
        </div>

        <SlotBox driver={slotB} slot={1} onRemove={() => onRemove(slotB?.driverId)} pulse={pulseB} isMobile={isMobile} />
      </div>
    </>
  )
}
