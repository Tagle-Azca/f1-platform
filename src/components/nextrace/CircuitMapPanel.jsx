import { motion } from 'framer-motion'
import Panel from '../ui/Panel'

export default function CircuitMapPanel({ lat, lng }) {
  if (!lat || !lng) return null

  const fLat = parseFloat(lat)
  const fLng = parseFloat(lng)

  return (
    <Panel
      padding="none"
      as={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Circuit Location
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {fLat.toFixed(4)}°, {fLng.toFixed(4)}°
        </span>
      </div>
      <iframe
        title="Circuit Map"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${fLng - 0.012},${fLat - 0.008},${fLng + 0.012},${fLat + 0.008}&layer=mapnik&marker=${lat},${lng}`}
        style={{ width: '100%', flex: 1, minHeight: 300, border: 'none', display: 'block', filter: 'invert(0.92) hue-rotate(180deg) saturate(0.7)' }}
        loading="lazy"
      />
    </Panel>
  )
}
