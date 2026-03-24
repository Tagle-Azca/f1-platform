import { motion } from 'framer-motion'
import { useCountdown } from '../../hooks/useCountdown'
import CountdownDisplay from '../ui/CountdownDisplay'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { countryFlag } from '../../utils/flags'

export default function HomeHero({ race }) {
  const { isMobile } = useBreakpoint()
  const isLive    = !!race?.currentSession
  const countdown = useCountdown(!isLive ? race?.raceDateTime : null)
  const raceName  = race?.raceName?.replace(' Grand Prix', ' GP') ?? ''
  const flagUrl   = race?.country ? countryFlag(race.country) : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '1.25rem',
        paddingTop: '0.2rem',
        marginBottom: '1rem',
      }}
    >
      {/* ── Title ── */}
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          lineHeight: 1,
          margin: 0,
          background: 'linear-gradient(to bottom, #fff 60%, #888)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        PITWALL INTELLIGENCE
      </motion.h1>

      {/* ── Tagline ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: isMobile ? '0.6rem' : '0.82rem',
          color: 'rgba(255, 255, 255, 0.79)',
          letterSpacing: isMobile ? '0.1em' : '0.28em',
          textTransform: 'uppercase',
          margin: 0,
          fontWeight: 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: isMobile ? 'nowrap' : 'normal',
          maxWidth: '100%',
        }}
      >
        DECADES OF SPEED // MILLISECONDS OF PRECISION
      </motion.p>

      {/* ── GP Countdown ── */}
      {race && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.01rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            width: '100%',
            maxWidth: 480,
          }}
        >
          {isLive ? (
            <>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#e10600',
              }}>
                {race.currentSession.label} · LIVE NOW
              </div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1.3rem', fontWeight: 700,
                color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                {raceName}
              </div>
            </>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: isMobile ? '0.65rem' : '0.88rem',
                fontWeight: 700,
                letterSpacing: isMobile ? '0.08em' : '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.51)',
              }}>
                {flagUrl && (
                  <img
                    src={flagUrl}
                    alt={race.country}
                    style={{ width: isMobile ? 18 : 22, height: 'auto', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.5)', flexShrink: 0 }}
                  />
                )}
                {raceName} · RACE STARTS IN
              </div>
              <CountdownDisplay parts={countdown} size="lg" />
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
