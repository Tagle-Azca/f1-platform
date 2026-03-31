import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import AccentBanner from '../ui/AccentBanner'
import { TZ_OPTIONS, getInitialTZ, saveTZ, tzAbbr, formatInTZ } from '../../utils/timezone'

const SESSION_LABELS = {
  fp1: 'FP1', fp2: 'FP2', fp3: 'FP3',
  sprintQualifying: 'Sprint Quali', sprint: 'Sprint',
  qualifying: 'Qualifying', race: 'Race',
}

function fmtRaceDateTime(date, time, tz) {
  if (!date) return null
  const t = (time || '00:00:00').replace(/Z$/i, '')
  const d = new Date(`${date}T${t}Z`)
  if (isNaN(d)) return null
  const weekday = d.toLocaleString('en-US', { timeZone: tz, weekday: 'short' }).toUpperCase()
  const month   = d.toLocaleString('en-US', { timeZone: tz, month: 'short' }).toUpperCase()
  const day     = d.toLocaleString('en-US', { timeZone: tz, day: 'numeric' })
  const hhmm    = d.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
  return `${weekday}. ${month} ${day} · ${hhmm} ${tzAbbr(tz)}`
}

export default function NextRaceBanner({ race, totalRounds }) {
  const { isMobile } = useBreakpoint()
  const isLive = !!race.currentSession
  const [open,       setOpen]       = useState(false)
  const [tz,         setTz]         = useState(getInitialTZ)
  const [pickerOpen, setPickerOpen] = useState(false)

  function selectTz(value) {
    setTz(value)
    setPickerOpen(false)
    saveTZ(value)
  }

  const sessions = race.schedule
    ? Object.entries(race.schedule)
        .filter(([k]) => k !== 'isSprint')
        .map(([key, val]) => ({ key, label: SESSION_LABELS[key] || key, ...val }))
    : []

  const circuitCode = (race.locality || race.raceName?.replace(' Grand Prix', '') || '').toUpperCase()
  const raceDateLine = fmtRaceDateTime(race.date, race.time, tz)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ marginBottom: '1.5rem' }}
    >
      <AccentBanner color="var(--accent-color)" padding="sm" radius={10}>
        {/* Main row */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
            cursor: sessions.length ? 'pointer' : 'default',
          }}
          onClick={() => sessions.length && setOpen(o => !o)}
        >
          {/* Left: circuit badge + race name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-color)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', flexShrink: 0 }}>
              {isLive ? `LIVE · ${race.currentSession.label}` : `Rd ${race.round}/${totalRounds}`}
            </span>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
            {/* Engineering circuit badge */}
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.9)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4,
              padding: '1px 7px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              RD {String(race.round).padStart(2, '0')} // {circuitCode}
            </span>
            {!isMobile && (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {race.raceName}
              </span>
            )}
          </div>

          {/* Right: live badge or date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.6rem' : '1.25rem', flexShrink: 0 }}>
            {isLive ? (
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
                color: '#e10600', textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 4,
                background: 'rgba(225,6,0,0.12)', border: '1px solid rgba(92, 6, 3, 0.3)',
              }}>
                Race in progress
              </span>
            ) : raceDateLine && !isMobile ? (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                {raceDateLine}
              </span>
            ) : null}

            {sessions.length > 0 && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14, color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            )}
          </div>
        </div>

        {/* Weekend schedule */}
        {open && sessions.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>

            {/* Timezone selector row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.6rem', position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setPickerOpen(v => !v) }}
                style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em',
                  color: pickerOpen ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: pickerOpen ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${pickerOpen ? 'rgba(225,6,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  transition: 'all 0.15s',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11, opacity: 0.5 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {tzAbbr(tz)}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 9, height: 9, opacity: 0.5, transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {pickerOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                    background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    zIndex: 200, minWidth: 220, maxHeight: 280, overflowY: 'auto',
                  }}
                >
                  {TZ_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => selectTz(opt.value)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '0.45rem 0.75rem',
                        background: tz === opt.value ? 'rgba(225,6,0,0.12)' : 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: tz === opt.value ? '#e10600' : 'rgba(255,255,255,0.7)',
                        fontSize: '0.75rem', fontWeight: tz === opt.value ? 700 : 400,
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (tz !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (tz !== opt.value) e.currentTarget.style.background = 'transparent' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {sessions.map(s => {
                const isRace = s.key === 'race'
                const isPast = new Date(`${s.date}T${(s.time || '00:00:00').replace(/Z$/i, '')}Z`) < new Date()
                const formatted = formatInTZ(s.date, s.time, tz, true)
                return (
                  <div
                    key={s.key}
                    style={{
                      gridColumn: isRace && sessions.length % 2 !== 0 ? '1 / -1' : undefined,
                      padding: '0.4rem 0.85rem', borderRadius: 7,
                      border: `1px solid ${isRace ? 'rgb(225, 7, 0)' : 'rgba(255,255,255,0.08)'}`,
                      background: isRace ? 'rgba(44, 2, 1, 0.96)' : 'rgba(22,22,22,0.9)',
                      opacity: isPast ? 0.45 : 1,
                    }}
                  >
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: isRace ? 'var(--f1-red)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, marginTop: 2 }}>
                      {formatted}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </AccentBanner>
    </motion.div>
  )
}
