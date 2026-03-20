import { motion } from 'framer-motion'

export default function HomeHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{ textAlign: 'center', marginBottom: '3.5rem' }}
    >
      <h1 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
        marginBottom: '0.5rem',
        background: 'linear-gradient(to bottom, #fff 60%, #999)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        PITWALL INTELLIGENCE
      </h1>

      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.85rem',
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: '0.3em',
        textTransform: 'uppercase',
        maxWidth: '600px',
        margin: '0 auto',
        fontWeight: 400,
      }}>
        Decades of Speed // Milliseconds of Precision
      </p>
    </motion.div>
  )
}
