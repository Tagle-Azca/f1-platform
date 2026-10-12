# Pitwall design tokens

Canonical source: `--pw-*` in `src/index.css`. Legacy `--surface-*`, `--text-*`, `--border-*` and the shadcn vars are aliases of these.
Dark only. Tailwind utilities: `bg-bg`, `bg-panel`, `bg-sidebar`, `border-edge`, `text-ink`, `text-ink-2`, `text-ink-3`, `text-steel`, `bg-steel-soft`, `text-pos`, `text-neg`, `text-violet`, `bg-live`, `text-signal-yellow`, spacing `pw-1..pw-8` (4px grid), `rounded-md` (12px), `rounded-pill`.

Values: bg #121418, panel #191c21, sidebar #161a1f, ink #eef1f4, ink-2 #a2abb4, ink-3 #939da8, steel #8fb4d8, steel-hi #b9d3ec, pos #6fce9a, neg #e08585, red #e0574e, violet #c9a0e8, yellow #f5c518, orange #fb923c.

## Computed WCAG contrast (scripts/contrast.mjs; re-run with `node scripts/contrast.mjs`)

| Foreground | Background | Ratio | Required | Result |
|---|---|---|---|---|
| ink | panel | 15.07:1 | 4.5:1 | pass |
| ink2 | panel | 7.34:1 | 4.5:1 | pass |
| ink3 | panel | 6.21:1 | 4.5:1 | pass |
| steel | panel | 7.88:1 | 4.5:1 | pass |
| steelHi | panel | 11.06:1 | 4.5:1 | pass |
| pos | panel | 8.92:1 | 4.5:1 | pass |
| neg | panel | 6.40:1 | 4.5:1 | pass |
| violet | panel | 7.87:1 | 4.5:1 | pass |
| yellow | panel | 10.48:1 | 4.5:1 | pass |
| orange | panel | 7.55:1 | 4.5:1 | pass |
| red | panel | 4.59:1 | 3:1 | pass |
| ink | bg | 16.26:1 | 4.5:1 | pass |
| ink2 | bg | 7.92:1 | 4.5:1 | pass |
| ink3 | bg | 6.70:1 | 4.5:1 | pass |
| steel | bg | 8.51:1 | 4.5:1 | pass |
| steelHi | bg | 11.93:1 | 4.5:1 | pass |
| pos | bg | 9.63:1 | 4.5:1 | pass |
| neg | bg | 6.90:1 | 4.5:1 | pass |
| violet | bg | 8.50:1 | 4.5:1 | pass |
| yellow | bg | 11.31:1 | 4.5:1 | pass |
| orange | bg | 8.15:1 | 4.5:1 | pass |
| red | bg | 4.95:1 | 3:1 | pass |
| ink | sidebar | 15.42:1 | 4.5:1 | pass |
| ink2 | sidebar | 7.51:1 | 4.5:1 | pass |
| ink3 | sidebar | 6.35:1 | 4.5:1 | pass |
| steel | sidebar | 8.06:1 | 4.5:1 | pass |
| steelHi | sidebar | 11.31:1 | 4.5:1 | pass |
| pos | sidebar | 9.13:1 | 4.5:1 | pass |
| neg | sidebar | 6.54:1 | 4.5:1 | pass |
| violet | sidebar | 8.05:1 | 4.5:1 | pass |
| yellow | sidebar | 10.72:1 | 4.5:1 | pass |
| orange | sidebar | 7.72:1 | 4.5:1 | pass |
| red | sidebar | 4.70:1 | 3:1 | pass |
| ink | steel-soft/panel | 12.09:1 | 4.5:1 | pass |
| ink2 | steel-soft/panel | 5.89:1 | 4.5:1 | pass |
| ink3 | steel-soft/panel | 4.98:1 | 4.5:1 | pass |
| steel | steel-soft/panel | 6.32:1 | 4.5:1 | pass |
| steelHi | steel-soft/panel | 8.87:1 | 4.5:1 | pass |
| pos | steel-soft/panel | 7.16:1 | 4.5:1 | pass |
| neg | steel-soft/panel | 5.13:1 | 4.5:1 | pass |
| violet | steel-soft/panel | 6.32:1 | 4.5:1 | pass |
| yellow | steel-soft/panel | 8.41:1 | 4.5:1 | pass |
| orange | steel-soft/panel | 6.06:1 | 4.5:1 | pass |
| red | steel-soft/panel | 3.68:1 | 3:1 | pass |
| bg (button text) | steel (primary btn) | 8.51:1 | 4.5:1 | pass |
| bg (button text) | neg (destructive btn) | 6.90:1 | 4.5:1 | pass |
| bg (chip text) | red (LIVE chip) | 4.95:1 | 4.5:1 | pass |
| ink (LIVE word) | red 15% tint on panel | 12.71:1 | 4.5:1 | pass |
| steel (focus ring) | panel | 7.88:1 | 3:1 | pass |

## Pass 2 additions (data-viz pass)

**Fonts (all self-hosted, no Google origins).** Geist Variable (OFL-1.1, `src/assets/fonts/LICENSE-geist.txt`, latin + latin-ext, `src/styles/fonts.css`) is the display face: `font-display` / `--pw-display`, with a metric-matched `Geist Fallback` over Arial (size-adjust 109.2%, ascent 92.05%, descent 27.02%). Barlow 300-800 and Barlow Condensed 300-900 (+ italic 400/700) are shipped from `@fontsource/*` exactly as the former Google URL loaded them (latin). Barlow Condensed is retired from `/`, `/live`, `/next-race` and the shell, and still used by other pages. Tabular figures: `tests/fonts.spec.js` proves "1111" and "0000" have equal width in Geist 600 with `tabular-nums`.

**Type utilities (index.css, `@layer components`).** `text-hero` 32/48 700, `text-title` 28/32 600, `text-stat` 28/36 600 tabular, `text-count` 40/56 600 tabular, `text-heading` 20/22 600, `.num` mono 13/14 tabular. `.section` = unboxed block (`border-top` + 24px padding; `.panel` is unchanged).

**Tokens.** `--pw-raise` (`bg-raise`) `#1e2329`, `--pw-hover` (`bg-hover`). Viz: `--viz-axis/-grid/-baseline/-track/-now`, `--viz-series-1/-2`, `--viz-tyre-soft|medium|hard|inter|wet|ink`, `--viz-sector-best|pb|slow`, `--viz-flash-gain|loss|neutral`. Motion: `--ease-out`, `--ease-inout`, `--dur-press|fast|base|enter|bars|draw|flash`. JS mirrors: `src/styles/vizPalette.js` (a unit test keeps the hex values in sync with the CSS), `src/styles/motion.js`, `src/styles/chartTheme.js`.

**One palette rule.** Team, tyre, sector, track-status and flash colors come only from `vizPalette.js` / `--viz-*`. `teamMark(hex, bg, min=3)` lifts a team color toward white only when it is under 3:1 on its ground (Red Bull). Every encoding has a non-color backup: driver code or name (team), letter (tyre), glyph + sr text (sector), words (status), "+N LAP" and hatch (lapped).

**Radius.** 12px (`rounded-md`) for surfaces and controls, `rounded-pill` for chips, 2px data marks. `rounded-xs|sm|lg` are not used on the touched pages.

**Contrast.** `node scripts/contrast.mjs` now also checks ink/ink-2/ink-3 on `--pw-raise`, `teamMark` for every `CTOR_COLORS` entry on panel and bg (>= 3:1), tyre disc vs panel (>= 3:1) and tyre letter vs disc (>= 4.5:1), steel on steel-soft, and ink on the three flash tints. All pairs pass.
