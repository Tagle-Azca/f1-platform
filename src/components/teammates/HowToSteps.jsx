import { Search, Link2, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const STEPS = [
  { icon: <Search size={16} />,    label: 'Pick a driver',   desc: 'Search or choose below'  },
  { icon: <Link2 size={16} />,     label: 'Add a teammate',  desc: 'Click any chip to chain' },
  { icon: <BarChart2 size={16} />, label: 'Compare careers', desc: 'Up to 3 drivers at once' },
]

export default function HowToSteps({ driverCount }) {
  const { isMobile } = useBreakpoint()
  const activeStep = driverCount === 0 ? 0 : driverCount < 3 ? 1 : 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'nowrap' }}>
      {STEPS.map((s, i) => {
        const done   = i < activeStep
        const active = i === activeStep
        const color    = done ? '#22c55e' : active ? '#ef4444' : 'var(--border-color)'
        const textCol  = done ? '#FFFFFF' : active ? '#fff' : 'var(--text-muted)'

        if (isMobile && !active) return null

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: isMobile ? undefined : 1 }}>
            <motion.div
              key={activeStep}
              initial={isMobile ? { opacity: 0, y: 4 } : false}
              animate={{ scale: active ? 1.05 : 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                flex: isMobile ? undefined : 1,
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.45rem 0.65rem',
                borderRadius: 8,
                border: `1px solid ${color}`,
                background: active ? 'rgba(84, 19, 19, 0.72)' : done ? 'rgba(11, 106, 46, 0.72)' : 'rgba(22,22,22,0.92)',
                transition: 'all 0.3s',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0, filter: active || done ? 'none' : 'grayscale(1) opacity(0.4)' }}>
                {done ? '✓' : s.icon}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: textCol, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                <div style={{ fontSize: '0.62rem', color: done ? '#FFFFFF' : active ? 'rgba(255, 255, 255, 0.94)' : 'var(--text-muted)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.desc}</div>
              </div>
            </motion.div>

            {!isMobile && i < STEPS.length - 1 && (
              <div style={{ width: 12, height: 1, background: i < activeStep ? '#22c55e44' : 'var(--border-subtle)', flexShrink: 0 }} />
            )}
          </div>
        )
      })}

      {driverCount > 0 && driverCount < 3 && (
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            marginLeft: '0.75rem',
            fontSize: '0.68rem', fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'var(--surface-3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 99, padding: '2px 10px',
          }}
        >
          {3 - driverCount} slot{3 - driverCount !== 1 ? 's' : ''} left
        </motion.span>
      )}
      {driverCount === 3 && (
        <motion.span
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginLeft: '0.75rem', fontSize: '0.68rem', color: 'var(--f1-red)' }}
        >
          Remove one to add another
        </motion.span>
      )}
    </div>
  )
}
