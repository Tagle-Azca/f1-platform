import { asObjectArray } from '../../utils/safeArray'
import { safeString } from '../../utils/safeText'

export const STATUS_TEXT = { done: 'Done', next: 'Next', live: 'Live', upcoming: 'Upcoming' }
export const WIDTH = 720
export const LANE_GAP = 12
const MIN_SPACING = 96
const AFTER_LAST_MS = 3 * 3600_000

const dayKeyOf = (t, tz) => new Date(t).toLocaleDateString('en-CA', { timeZone: tz })
const dayLabelOf = (t, tz) => {
  const o = (opt) => new Date(t).toLocaleString('en-US', { timeZone: tz, ...opt })
  return `${o({ weekday: 'short' })} ${o({ day: 'numeric' })} ${o({ month: 'short' })}`
}
export const timeOf = (t, tz) => new Date(t).toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })

/** Normalizes the session list: only entries with a parseable dateTime survive, sorted by time. */
function normalize(sessions) {
  return asObjectArray(sessions)
    .map((s) => ({ key: safeString(s.key), label: safeString(s.label), status: Object.hasOwn(STATUS_TEXT, s.status) ? s.status : 'upcoming', dateTime: safeString(s.dateTime), t: Date.parse(s.dateTime) }))
    .filter((s) => Number.isFinite(s.t))
    .sort((a, b) => a.t - b.t)
}

/**
 * Pure geometry for the lg+ axis. One lane per calendar day (in `tz`) with equal widths; markers sit at real
 * start times between the day's first and last session (20% padding so neighbouring labels never touch, at least 96 units apart). No durations are invented.
 * Returns { lanes: [{ dayKey, label, x0, w, items: [{ ...session, x, side }] }], nowX }.
 */
export function layoutTimeline(sessions, tz, now, width = WIDTH) {
  const list = normalize(sessions)
  if (!list.length) return { lanes: [], nowX: null }
  const groups = []
  for (const s of list) {
    const k = dayKeyOf(s.t, tz)
    const g = groups[groups.length - 1]
    if (g && g.dayKey === k) g.sessions.push(s)
    else groups.push({ dayKey: k, sessions: [s] })
  }
  const n = groups.length
  const laneW = (width - LANE_GAP * (n - 1)) / n
  let counter = 0
  const lanes = groups.map((g, i) => {
    const x0 = i * (laneW + LANE_GAP)
    const xmin = x0 + laneW * 0.2, xmax = x0 + laneW * 0.8
    const first = g.sessions[0].t, last = g.sessions[g.sessions.length - 1].t
    let xs = g.sessions.map((s) => (g.sessions.length === 1 ? x0 + laneW / 2 : last === first ? xmin : xmin + ((s.t - first) / (last - first)) * (xmax - xmin)))
    for (let j = 1; j < xs.length; j++) xs[j] = Math.max(xs[j], xs[j - 1] + MIN_SPACING)
    if (xs.length > 1 && xs[xs.length - 1] > xmax) xs = xs.map((_, j) => xmin + (j / (xs.length - 1)) * (xmax - xmin))
    const items = g.sessions.map((s, j) => ({ ...s, i: counter++, x: xs[j], side: j > 0 && xs[j] - xs[j - 1] < 110 && j % 2 === 1 ? 'above' : 'below' }))
    return { dayKey: g.dayKey, label: dayLabelOf(first, tz), weatherKey: g.sessions[0].dateTime.slice(0, 10), x0, w: laneW, items }
  })

  const anchors = lanes.flatMap((l, li) => l.items.map((it) => ({ t: it.t, x: it.x, li })))
  let nowX = null
  if (Number.isFinite(now)) {
    const a0 = anchors[0], aN = anchors[anchors.length - 1]
    if (now < a0.t) nowX = dayKeyOf(now, tz) === lanes[0].dayKey ? lanes[0].x0 : null
    else if (now >= aN.t) nowX = now < aN.t + AFTER_LAST_MS ? aN.x : null
    else {
      for (let i = 0; i < anchors.length - 1; i++) {
        const a = anchors[i], b = anchors[i + 1]
        if (now >= a.t && now < b.t) {
          if (a.li === b.li) nowX = a.x + ((now - a.t) / (b.t - a.t)) * (b.x - a.x)
          else nowX = (lanes[a.li].x0 + lanes[a.li].w + lanes[b.li].x0) / 2
          break
        }
      }
    }
  }
  return { lanes, nowX }
}
