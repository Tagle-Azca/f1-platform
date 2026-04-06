import { motion } from 'framer-motion'
import { useCountdown } from '../../hooks/useCountdown'
import CountdownDisplay from '../ui/CountdownDisplay'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { countryFlag } from '../../utils/flags'

function buildHeadline(data) {
  if (!data) return null
  const { standings, lastRace, totalRounds, roundsDone } = data
  const leader    = standings?.[0]
  const p2        = standings?.[1]
  const winner    = lastRace?.winner?.name
  const raceName  = lastRace?.raceName?.replace(' Grand Prix', '')
  const gap       = leader && p2 ? leader.points - p2.points : null
  const remaining = totalRounds && roundsDone != null ? totalRounds - roundsDone : null

  if (!leader) return null

  const tension = gap === null     ? ''
    : gap <= 15  ? ' · TITLE FIGHT ON'
    : gap <= 40  ? ' · Gap is closing'
    : gap <= 80  ? ' · Championship battle'
    : ' · Dominant lead'

  if (winner && raceName && gap !== null && remaining !== null)
    return ` ${leader.name} leads by ${gap}pts · ${remaining} rounds left${tension}`

  if (gap !== null && remaining !== null)
    return `${leader.name} leads by ${gap}pts · ${remaining} rounds remaining${tension}`

  return `${leader.name} leads the ${new Date().getFullYear()} championship`
}

export default function HomeHero({ race, data }) {
  const { isMobile } = useBreakpoint()
  const isLive    = !!race?.currentSession
  const countdown = useCountdown(!isLive ? race?.raceDateTime : null)
  const raceName  = race?.raceName?.replace(' Grand Prix', ' GP') ?? ''
  const flagUrl   = race?.country ? countryFlag(race.country) : null
  const headline  = buildHeadline(data)

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
        gap: '0.65rem',
        paddingTop: '0.2rem',
        marginBottom: '1rem',
      }}
    >
      {/* ── Wordmark — demoted to whisper ── */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.6rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
        }}
      >
        PITWALL INTELLIGENCE
      </motion.span>

      {/* ── Headline — dominant element ── */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: headline
            ? `clamp(1rem, ${isMobile ? '3.8vw' : '2.4vw'}, ${isMobile ? '1.3rem' : '1.85rem'})`
            : 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 900,
          letterSpacing: headline ? '0.02em' : '0.14em',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          margin: 0,
          // Dynamic headline: plain white. Fallback title: gradient.
          color: headline ? 'var(--text-primary)' : undefined,
          background: headline ? undefined : 'linear-gradient(to bottom, #fff 40%, var(--accent-color))',
          WebkitBackgroundClip: headline ? undefined : 'text',
          WebkitTextFillColor: headline ? undefined : 'transparent',
          maxWidth: '92%',
        }}
      >
        {headline ?? 'PITWALL INTELLIGENCE'}
      </motion.h1>

      {/* ── GP Countdown ── */}
      {race && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            width: '100%',
            maxWidth: 480,
          }}
        >
          {isLive ? (
            <>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: 'var(--accent-color)',
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
