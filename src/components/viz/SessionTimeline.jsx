import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { layoutTimeline, STATUS_TEXT, WIDTH, LANE_GAP, timeOf } from './timelineLayout'
import { formatDayWeather } from '../../utils/weather'
import { DUR, EASE_INOUT, EASE_OUT, staggerDelay, useReducedMotion } from '../../styles/motion'

function MarkerShape({ status, x, y, delay, reduced }) {
  const fade = reduced ? { initial: false } : { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.3, ease: EASE_OUT, delay } }
  const base = { cx: x, cy: y, r: 5, className: 'viz-center', ...fade }
  if (status === 'done') return <motion.circle {...base} fill="var(--pw-ink-3)" />
  if (status === 'live') return <motion.circle {...base} fill="var(--pw-red)" />
  if (status === 'next') return <motion.circle {...base} fill="var(--pw-bg)" stroke="var(--viz-now)" strokeWidth="2" />
  return <motion.circle {...base} fill="var(--pw-bg)" stroke="var(--pw-ink-3)" strokeWidth="2" />
}

const RAIL_MARK = {
  done: 'bg-ink-3',
  live: 'bg-live',
  next: 'border-2 border-steel bg-bg',
  upcoming: 'border-2 border-ink-3 bg-bg',
}

/**
 * Weekend timeline. Base DOM is an <ol> of days and sessions (name, local time, status text) with the per-day
 * forecast as the day header. Below lg that list is the visual (vertical rail). From lg it is sr-only and an
 * aria-hidden day-lane axis is drawn instead. `weather` is keyed by YYYY-MM-DD (Open-Meteo daily data).
 */
export default function SessionTimeline({ sessions, tz = 'UTC', now, weather = null, caption = false, className = '' }) {
  const reduced = useReducedMotion()
  const [fallbackNow] = useState(() => Date.now())
  const nowMs = Number.isFinite(now) ? now : fallbackNow
  const geo = useMemo(() => layoutTimeline(sessions, tz, nowMs), [sessions, tz, nowMs])
  if (!geo.lanes.length) return null
  const total = geo.lanes.reduce((n, l) => n + l.items.length, 0)
  const wx = (lane) => (weather && typeof weather === 'object' && Object.hasOwn(weather, lane.weatherKey) ? formatDayWeather(weather[lane.weatherKey]) : '')
  const anyWx = geo.lanes.some(l => wx(l))
  const AXIS_Y = anyWx ? 96 : 76
  const H = anyWx ? 160 : 140
  const axis = () => (reduced ? { initial: false } : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.7, ease: EASE_INOUT } })

  return (
    <div className={className}>
      <ol className="list-none lg:sr-only" data-timeline-list>
        {geo.lanes.map((lane) => (
          <li key={lane.dayKey}>
            <p className="pt-pw-3 pb-pw-1 pl-pw-6 text-sm font-medium text-ink-2">
              {lane.label}{wx(lane) ? <span className="text-ink-3">{`, ${wx(lane)}`}</span> : null}
            </p>
            <ol className="list-none">
              {lane.items.map((it) => {
                const idx = it.i
                return (
                  <li key={it.key || it.dateTime} className="relative flex min-h-11 items-center gap-pw-3 pl-pw-6" data-status={it.status}>
                    <span aria-hidden="true" className={`absolute left-[4px] w-0.5 bg-[var(--viz-baseline)] ${idx === 0 ? 'top-1/2' : 'top-0'} ${idx === total - 1 ? 'bottom-1/2' : 'bottom-0'}`} />
                    <span aria-hidden="true" className={`absolute left-0 size-[10px] rounded-pill ${RAIL_MARK[it.status]}`} />
                    <span className={`min-w-0 flex-1 truncate text-base ${it.status === 'done' ? 'text-ink-2' : 'text-ink font-medium'}`}>{it.label}</span>
                    <span className="num shrink-0 text-ink-2">{timeOf(it.t, tz)}</span>
                    <span className={`w-20 shrink-0 text-right text-xs font-semibold ${it.status === 'next' ? 'text-steel' : it.status === 'live' ? 'text-ink' : 'text-ink-3'}`}>{STATUS_TEXT[it.status]}</span>
                  </li>
                )
              })}
            </ol>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block" aria-hidden="true">
        <svg viewBox={`0 0 ${WIDTH} ${H}`} className="block h-auto w-full" focusable="false" data-timeline-axis>
          {geo.lanes.map((lane, li) => (
            <g key={lane.dayKey}>
              <text x={lane.x0} y="14" className="fill-ink-2 text-sm font-medium">{lane.label}</text>
              {wx(lane) && <text x={lane.x0} y="31" className="fill-ink-3 text-xs">{wx(lane)}</text>}
              <motion.path d={`M${lane.x0} ${AXIS_Y} H${lane.x0 + lane.w}`} stroke="var(--viz-baseline)" strokeWidth="2" fill="none" {...axis()} />
              {li > 0 && <path d={`M${lane.x0 - LANE_GAP / 2} ${AXIS_Y - 6} V${AXIS_Y + 6}`} stroke="var(--viz-baseline)" strokeWidth="1" />}
              {lane.items.map((it) => {
                const delay = 0.7 + staggerDelay(it.i, 0.05) // markers follow the axis draw
                const above = it.side === 'above'
                const cx = Math.min(Math.max(it.x, 34), WIDTH - 34)
                return (
                  <g key={it.key || it.dateTime}>
                    <MarkerShape status={it.status} x={it.x} y={AXIS_Y} delay={delay} reduced={reduced} />
                    <text x={cx} y={above ? AXIS_Y - 20 : AXIS_Y + 24} textAnchor="middle" className="fill-ink text-sm font-medium">{it.label}</text>
                    <text x={cx} y={above ? AXIS_Y - 34 : AXIS_Y + 40} textAnchor="middle" className="fill-ink-2 num">{timeOf(it.t, tz)}</text>
                    {it.status === 'live' && <text x={cx} y={above ? AXIS_Y - 48 : AXIS_Y + 56} textAnchor="middle" className="fill-ink text-xs font-semibold">Live</text>}
                  </g>
                )
              })}
            </g>
          ))}
          {geo.nowX !== null && (
            <g>
              <motion.rect x={geo.nowX - 1} y={AXIS_Y - 56} width="2" height="90" fill="var(--viz-now)" {...(reduced ? { initial: false } : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: DUR.fast, delay: 1.1 } })} />
              <text x={Math.min(Math.max(geo.nowX, 14), WIDTH - 14)} y={H - 10} textAnchor="middle" className="fill-steel text-xs font-semibold">Now</text>
            </g>
          )}
        </svg>
        {caption && <p className="mt-pw-1 text-xs text-ink-3">Days are compressed; hours are not to scale across days.</p>}
      </div>
    </div>
  )
}
