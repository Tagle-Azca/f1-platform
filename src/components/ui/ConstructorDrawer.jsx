import { motion, AnimatePresence } from 'framer-motion'
import ConstructorDetail from '../encyclopedia/ConstructorDetail'

export default function ConstructorDrawer({ constructor: ctor, onClose }) {
  return (
    <AnimatePresence>
      {ctor && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            }}
          />

          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
              width: Math.min(580, window.innerWidth),
              background: 'var(--bg-base)',
              borderLeft: '1px solid var(--border-color)',
              overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-color)',
              position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 10,
            }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Constructor Profile
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  {ctor.name}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-2)', color: 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', lineHeight: 1,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ padding: '1rem 1.25rem', flex: 1 }}>
              <ConstructorDetail constructorId={ctor.constructorId} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
