import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { countryFlag } from '../../utils/flags'
import { fmtDate } from '../../utils/date'
import { ctorColor } from '../../utils/teamColors'
import { useCountdown } from '../../hooks/useCountdown'

function CountdownBadge({ dateStr, timeStr }) {
  const dt = dateStr ? new Date(`${dateStr}T${(timeStr || '00:00:00').replace(/Z$/i, '')}Z`) : null
  const parts = useCountdown(dt?.toISOString())
  if (!parts) return null
  if (parts.d > 0) return (
    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
      in {parts.d}d {parts.h}h
    </span>
  )
  return (
    <span style={{ fontSize: '0.72rem', color: '#f5c518', fontVariantNumeric: 'tabular-nums' }}>
      in {parts.h}h {parts.m}m
    </span>
  )
}

import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function RaceCard({ race, index, isNextRace }) {
  const [hovered, setHovered] = useState(false)
  const { isMobile } = useBreakpoint()
  const flag         = countryFlag(race.Circuit?.Location?.country)
  const isCurrentWknd = race.isCurrentWeekend
  const isUpcoming   = race.isUpcoming && !isCurrentWknd
  const isCompleted  = race.hasResults
  const winner       = race.winner
  const winnerColor  = winner ? ctorColor(winner.Constructor?.constructorId) : null

  const borderColor = isCurrentWknd
    ? 'rgba(225,6,0,0.5)'
    : isNextRace
    ? 'rgba(234,179,8,0.4)'
    : isCompleted
    ? 'rgba(34,197,94,0.15)'
    : 'var(--border)'

  const bgColor = isCurrentWknd
    ? 'rgba(50,8,8,0.92)'
    : isNextRace
    ? 'rgba(40,34,4,0.92)'
    : 'rgba(22,22,22,0.92)'

  const tooltipText = race.hasResults
    ? 'View results, qualifying & full weekend details'
    : 'View circuit info & schedule'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ opacity: 1, position: 'relative' }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: 'rgba(18,18,18,0.97)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: 6,
              padding: '0.3rem 0.7rem',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            {tooltipText}
            {/* Arrow */}
            <span style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8, height: 8,
              background: 'rgba(18,18,18,0.97)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderTop: 'none',
              borderLeft: 'none',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
      <Link to={`/races/${race.season}/${race.round}`} style={{ textDecoration: 'none' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.85rem 1.25rem',
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderLeft: isCurrentWknd ? '3px solid var(--f1-red)' : isNextRace ? '3px solid #eab308' : isCompleted ? '3px solid rgba(34,197,94,0.4)' : '3px solid transparent',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = isCurrentWknd ? 'rgba(60,10,10,0.95)' : isNextRace ? 'rgba(50,44,6,0.95)' : 'rgba(30,30,30,0.95)' }}
          onMouseLeave={e => { e.currentTarget.style.background = bgColor }}
        >
          {/* Round */}
          <span style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.3rem', fontWeight: 900,
            color: isCurrentWknd ? 'var(--f1-red)' : isNextRace ? '#eab308' : 'var(--text-muted)',
            width: 38, flexShrink: 0, textAlign: 'center',
          }}>
            R{race.round}
          </span>

          {/* Flag */}
          <div style={{ width: 30, flexShrink: 0 }}>
            {flag
              ? <img src={flag} alt="" style={{ width: 28, height: 'auto', borderRadius: 2 }} />
              : <div style={{ width: 28, height: 18, background: 'var(--border)', borderRadius: 2 }} />
            }
          </div>

          {/* Race name + circuit */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '1rem', fontWeight: 700,
                color: isCurrentWknd ? '#fff' : isUpcoming ? 'var(--text-secondary)' : 'var(--text-primary)',
              }}>
                {isMobile ? race.raceName.replace(' Grand Prix', ' GP') : race.raceName}
              </span>

              {/* Status badges */}
              {isCurrentWknd && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(225,6,0,0.18)', color: 'var(--f1-red)',
                  border: '1px solid rgba(225,6,0,0.35)',
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--f1-red)', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  This Weekend
                </span>
              )}
              {isNextRace && !isCurrentWknd && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 4,
                  background: 'rgba(234,179,8,0.12)', color: '#eab308',
                  border: '1px solid rgba(234,179,8,0.3)',
                }}>
                  Next Race
                </span>
              )}
              {(race.hasSprint || race.hasSprintQualifying) && (
                <span style={{ fontSize: '0.55rem', fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', letterSpacing: '0.06em' }}>
                  SPRINT
                </span>
              )}
            </div>
            {!isMobile && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {race.Circuit?.circuitName}
                {race.Circuit?.Location?.locality && ` · ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`}
              </div>
            )}
          </div>

          {/* Right side: date + winner or countdown */}
          <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 120 }}>
            {isCompleted && winner ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
                  <div style={{ width: 3, height: 12, borderRadius: 2, background: winnerColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                    {winner.Driver?.givenName?.slice(0, 1)}. {winner.Driver?.familyName}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{fmtDate(race.date)}</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '0.2rem' }}>
                  <CountdownBadge dateStr={race.date} timeStr={race.time} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{fmtDate(race.date)}</div>
                {race.lastCircuitWinner?.driver && (
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {race.lastCircuitWinner.season} · {race.lastCircuitWinner.driver.givenName?.slice(0,1)}. {race.lastCircuitWinner.driver.familyName}
                  </div>
                )}
              </>
            )}
          </div>

          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>→</span>
        </div>
      </Link>
    </motion.div>
  )
}
