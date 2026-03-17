import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useCountdown } from '../../hooks/useCountdown'
import CountdownDisplay from '../ui/CountdownDisplay'
import AccentBanner from '../ui/AccentBanner'
import Flag from '../ui/Flag'
import { fmtDate } from '../../utils/date'

const SESSION_LABELS = {
  fp1: 'FP1', fp2: 'FP2', fp3: 'FP3',
  sprintQualifying: 'Sprint Quali', sprint: 'Sprint',
  qualifying: 'Qualifying', race: 'Race',
}

export default function NextRaceBanner({ race, totalRounds }) {
  const { isMobile } = useBreakpoint()
  // Dashboard always counts down to the RACE itself (the main event)
  const isLive    = !!race.currentSession
  const countdown = useCountdown(!isLive ? race.raceDateTime : null)
  const [open, setOpen] = useState(false)

  const sessions = race.schedule
    ? Object.entries(race.schedule)
        .filter(([k]) => k !== 'isSprint')
        .map(([key, val]) => ({ key, label: SESSION_LABELS[key] || key, ...val }))
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ marginBottom: '1.5rem' }}
    >
      <AccentBanner color="var(--f1-red)" padding="sm" radius={10}>
        {/* Main row */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
            cursor: sessions.length ? 'pointer' : 'default',
          }}
          onClick={() => sessions.length && setOpen(o => !o)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e10600', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(225,6,0,0.8)', textTransform: 'uppercase', flexShrink: 0 }}>
              {isLive ? `LIVE · ${race.currentSession.label}` : `Rd ${race.round}/${totalRounds}`}
            </span>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
            <Flag country={race.country} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: isMobile ? '0.88rem' : '1.05rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMobile ? race.raceName.replace(' Grand Prix', ' GP') : race.raceName}
            </span>
            {!isMobile && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {race.locality && `${race.locality}, `}{race.country}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.6rem' : '1.25rem', flexShrink: 0 }}>
            {isLive ? (
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                color: '#e10600', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 4,
                background: 'rgba(225,6,0,0.12)', border: '1px solid rgba(225,6,0,0.3)',
              }}>
                Race in progress
              </span>
            ) : (
              <CountdownDisplay parts={countdown} size={isMobile ? 'sm' : 'lg'} />
            )}

            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                  {fmtDate(race.date)}
                </div>
                {race.time && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {race.time.slice(0,5)} UTC
                  </div>
                )}
              </div>
            )}

            {sessions.length > 0 && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14, color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            )}
          </div>
        </div>

        {/* Weekend schedule */}
        {open && sessions.length > 0 && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '0.75rem',
            marginTop: '0.75rem',
            display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
          }}>
            {sessions.map(s => {
              const isRace = s.key === 'race'
              const dt = new Date(s.date + (s.time ? 'T' + s.time : 'T00:00:00Z'))
              const isPast = dt < new Date()
              return (
                <div
                  key={s.key}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 7,
                    border: `1px solid ${isRace ? 'rgba(225,6,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    background: isRace ? 'rgba(225,6,0,0.12)' : 'rgba(22,22,22,0.9)',
                    opacity: isPast ? 0.45 : 1,
                  }}
                >
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: isRace ? 'var(--f1-red)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>
                    {dt.toLocaleDateString('en-GB', { weekday: 'short' })} {String(dt.getDate()).padStart(2,'0')}/{String(dt.getMonth()+1).padStart(2,'0')}
                  </div>
                  {s.time && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {s.time.slice(0,5)} UTC
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </AccentBanner>
    </motion.div>
  )
}
