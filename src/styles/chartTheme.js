// Chart theme for recharts and canvas (UIUX section 4). Colors come from --viz-* CSS vars;
// canvas code resolves them once with readVizColors() at mount. No hex literals live here.
import { teamMark } from './vizPalette.js'

export const AXIS_TICK = { fill: 'var(--viz-axis)', fontSize: 12, fontFamily: 'Barlow, sans-serif' }
export const AXIS_TICK_NUM = { ...AXIS_TICK, fontFamily: 'var(--pw-mono)' }
export const AXIS_LINE = { stroke: 'var(--viz-baseline)', strokeWidth: 1 }
export const GRID = { stroke: 'var(--viz-grid)', strokeWidth: 1, vertical: false, strokeDasharray: undefined }

/** Series style: 1st solid steel, 2nd dashed ink-2, team series use teamMark; a dash separates teammates. */
export function seriesStyle(index, teamHex) {
  const dashed = index % 2 === 1
  return {
    stroke: teamHex ? teamMark(teamHex) : dashed ? 'var(--viz-series-2)' : 'var(--viz-series-1)',
    strokeWidth: 2,
    strokeDasharray: dashed ? '6 3' : undefined,
  }
}

export const TOOLTIP = {
  contentStyle: { background: 'var(--pw-raise)', border: '1px solid var(--pw-edge)', borderRadius: 12, padding: '8px 12px' },
  labelStyle: { color: 'var(--pw-ink)', fontWeight: 600, fontSize: 12 },
  itemStyle: { color: 'var(--pw-ink-2)', fontFamily: 'var(--pw-mono)', fontSize: 12 },
}

/** Recharts animation flags: off for reduced motion; stable id so polls never replay it. */
export function animationProps(reduced, id = 'once') {
  return reduced ? { isAnimationActive: false } : { isAnimationActive: true, animationDuration: 700, animationEasing: 'ease-out', animationId: id }
}

/** Dim non-active series to 35%. */
export const seriesOpacity = (activeKey, key) => (activeKey == null || activeKey === key ? 1 : 0.35)

/** Context lines in a crowded chart (Standings: everyone outside the highlighted set). */
export const MUTED_OPACITY = 0.25

export const EMPTY_TEXT = 'No data for this selection.'

const CANVAS_VARS = {
  ink: '--pw-ink', ink2: '--pw-ink-2', ink3: '--pw-ink-3', steel: '--pw-steel', track: '--viz-track',
  baseline: '--viz-baseline', bg: '--pw-bg', panel: '--pw-panel', red: '--pw-red', pos: '--pw-pos', neg: '--pw-neg',
}

/** Resolves the palette vars to concrete color strings for canvas drawing (call once at mount). */
export function readVizColors(el = document.documentElement) {
  const cs = getComputedStyle(el)
  return Object.fromEntries(Object.entries(CANVAS_VARS).map(([k, v]) => [k, cs.getPropertyValue(v).trim() || 'currentColor']))
}
