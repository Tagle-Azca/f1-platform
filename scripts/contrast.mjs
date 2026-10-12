// Computes WCAG 2.x contrast ratios for every --pw-* text/background pair.
// Usage: node scripts/contrast.mjs   (exit 1 if any required pair fails)
import { CTOR_COLORS, teamMark, contrastRatio, VIZ_HEX, BASE, TYPE_HEX } from '../src/styles/vizPalette.js'
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)))
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

export const T = {
  bg: '#121418', panel: '#191c21', sidebar: '#161a1f',
  ink: '#eef1f4', ink2: '#a2abb4', ink3: '#939da8',
  steel: '#8fb4d8', steelHi: '#b9d3ec', pos: '#6fce9a', neg: '#e08585',
  red: '#e0574e', violet: '#c9a0e8', yellow: '#f5c518', orange: '#fb923c',
}
const bg = hex(T.bg), panel = hex(T.panel), sidebar = hex(T.sidebar)
const steelSoftOnPanel = over(hex(T.steel), 0.12, panel)
const redChipOnPanel = over(hex(T.red), 0.15, panel)
const grounds = { 'panel': panel, 'bg': bg, 'sidebar': sidebar, 'steel-soft/panel': steelSoftOnPanel }
const rows = []
for (const [gn, g] of Object.entries(grounds))
  for (const k of ['ink', 'ink2', 'ink3', 'steel', 'steelHi', 'pos', 'neg', 'violet', 'yellow', 'orange', 'red'])
    rows.push({ fg: k, bg: gn, ratio: ratio(hex(T[k]), g), need: k === 'red' ? 3 : 4.5 })
// pairs with explicit backgrounds
rows.push({ fg: 'bg (button text)', bg: 'steel (primary btn)', ratio: ratio(bg, hex(T.steel)), need: 4.5 })
rows.push({ fg: 'bg (button text)', bg: 'neg (destructive btn)', ratio: ratio(bg, hex(T.neg)), need: 4.5 })
rows.push({ fg: 'bg (chip text)', bg: 'red (LIVE chip)', ratio: ratio(bg, hex(T.red)), need: 4.5 })
rows.push({ fg: 'ink (LIVE word)', bg: 'red 15% tint on panel', ratio: ratio(hex(T.ink), redChipOnPanel), need: 4.5 })
rows.push({ fg: 'steel (focus ring)', bg: 'panel', ratio: ratio(hex(T.steel), panel), need: 3 })
// ── Pass 2 (UIUX section 7) ──
const raise = hex('#1e2329')
for (const k of ['ink', 'ink2', 'ink3'])
  rows.push({ fg: k, bg: 'raise', ratio: ratio(hex(T[k]), raise), need: 4.5 })
rows.push({ fg: 'viz-axis (ink3)', bg: 'panel', ratio: ratio(hex(T.ink3), panel), need: 4.5 })
rows.push({ fg: 'ink3 (sticky thead)', bg: 'bg', ratio: ratio(hex(T.ink3), bg), need: 4.5 })
rows.push({ fg: 'viz-now (steel)', bg: 'panel', ratio: ratio(hex(T.steel), panel), need: 3 })
rows.push({ fg: 'viz-now (steel)', bg: 'bg', ratio: ratio(hex(T.steel), bg), need: 3 })
rows.push({ fg: 'viz-series-2 (ink2)', bg: 'panel', ratio: ratio(hex(T.ink2), panel), need: 3 })
for (const [k, v] of Object.entries({ soft: VIZ_HEX.tyreSoft, medium: VIZ_HEX.tyreMedium, hard: VIZ_HEX.tyreHard, inter: VIZ_HEX.tyreInter, wet: VIZ_HEX.tyreWet })) {
  rows.push({ fg: `tyre ${k} disc`, bg: 'panel', ratio: contrastRatio(v, BASE.panel), need: 3 })
  rows.push({ fg: `tyre letter on ${k} disc`, bg: k, ratio: contrastRatio(VIZ_HEX.tyreInk, v), need: 4.5 })
}
// Stale state: disc at 40% over the panel, letter in ink (B9: a global span color once forced ink-2 here)
for (const [k, v] of Object.entries({ soft: VIZ_HEX.tyreSoft, medium: VIZ_HEX.tyreMedium, hard: VIZ_HEX.tyreHard, inter: VIZ_HEX.tyreInter, wet: VIZ_HEX.tyreWet })) {
  const dim = over(hex(v), 0.4, panel)
  rows.push({ fg: `stale tyre letter (ink) on ${k} disc`, bg: 'disc 40% over panel', ratio: ratio(hex(T.ink), dim), need: 4.5 })
}
rows.push({ fg: 'steel on steel-soft', bg: 'panel', ratio: ratio(hex(T.steel), steelSoftOnPanel), need: 4.5 })
const gain = over(hex(T.pos), 0.18, panel), loss = over(hex(T.neg), 0.18, panel)
for (const [n, g] of [['gain', gain], ['loss', loss], ['neutral', steelSoftOnPanel]])
  rows.push({ fg: 'ink on flash ' + n, bg: 'tint over panel', ratio: ratio(hex(T.ink), g), need: 4.5 })
for (const [id, c] of Object.entries(CTOR_COLORS)) {
  rows.push({ fg: `teamMark ${id}`, bg: 'panel', ratio: contrastRatio(teamMark(c), BASE.panel), need: 3 })
  rows.push({ fg: `teamMark ${id}`, bg: 'bg', ratio: contrastRatio(teamMark(c, BASE.bg), BASE.bg), need: 3 })
}
// ── Circuits redesign (DoD-24): circuit-type tones are graphics only; >= 3:1 on every surface they sit on ──
for (const [k, v] of Object.entries(TYPE_HEX))
  for (const [gn, g] of [['panel', BASE.panel], ['bg', BASE.bg], ['raise', BASE.raise], ['basemap #0e1013', '#0e1013']])
    rows.push({ fg: `type tone ${k}`, bg: gn, ratio: contrastRatio(v, g), need: 3 })
let fail = 0
console.log('| Foreground | Background | Ratio | Required | Result |\n|---|---|---|---|---|')
for (const r of rows) {
  const ok = r.ratio >= r.need; if (!ok) fail++
  console.log(`| ${r.fg} | ${r.bg} | ${r.ratio.toFixed(2)}:1 | ${r.need}:1 | ${ok ? 'pass' : 'FAIL'} |`)
}
process.exit(fail ? 1 : 0)
