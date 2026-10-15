// Prints the `style={{` count per touched file and the total (DoD-7).
// Also prints the stricter count of every `style=` prop (catches `style={cond ? {...} : undefined}`).
// Usage: node scripts/count-inline-styles.mjs [--all]   (--all adds every other file edited in this pass)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const TARGETS = [
  'components/layout', 'components/standings/StandingsSidebar.jsx', 'components/home',
  'components/nextrace', 'components/dashboard', 'components/live', 'components/auth/LoginModal.jsx', 'components/auth/GuestProfile.jsx',
  'components/ui/DataRow.jsx', 'components/ui/Meter.jsx', 'components/ui/SectionHeader.jsx', 'components/ui/Disclosure.jsx', 'components/ui/StatLine.jsx',
  'components/ui/TyreBadge.jsx', 'components/ui/Panel.jsx', 'components/ui/TabBar.jsx', 'components/ui/StatCard.jsx', 'components/ui/LivePill.jsx',
  'components/ui/CountdownDisplay.jsx', 'components/ui/EmptyState.jsx', 'components/ui/BackendError.jsx', 'pages/HomePage.jsx', 'pages/TeammateHistoryPage.jsx', 'components/teammates', 'pages/CalendarPage.jsx', 'components/calendar', 'hooks/useTimezone.js', 'pages/LivePage.jsx', 'pages/NextRacePage.jsx',
]
function walk(p) {
  const abs = join(root, p)
  if (!existsSync(abs)) return []
  if (statSync(abs).isFile()) return [p]
  return readdirSync(abs).flatMap(f => walk(join(p, f)))
}
// Files edited in this pass that are outside the PLAN's counted list (Standings mobile check, Register/auth a11y).
const EXTRA = ['pages/StandingsPage.jsx', 'components/standings', 'pages/RegisterPage.jsx', 'components/auth/AuthField.jsx', 'components/auth/AuthInput.jsx', 'components/auth/AuthError.jsx', 'components/auth/AuthDivider.jsx', 'components/auth/TelemetrySelect.jsx']
const ALL = process.argv.includes('--all')
const files = [...new Set((ALL ? [...TARGETS, ...EXTRA] : TARGETS).flatMap(walk))].filter(f => /\.jsx?$/.test(f) && !f.endsWith('.test.jsx'))
let total = 0, over = 0, strict = 0
const rows = files.map(f => {
  const src = readFileSync(join(root, f), 'utf8')
  const n = (src.match(/style=\{\{/g) || []).length
  const m = (src.match(/\bstyle=\{/g) || []).length
  total += n; strict += m; if (m > 8) over++
  return [f, n, m]
})
rows.sort((a, b) => b[2] - a[2] || b[1] - a[1])
console.log('style={{  style=  file')
for (const [f, n, m] of rows) console.log(String(n).padStart(8), String(m).padStart(7), ' ', f)
console.log(`TOTAL style={{ ${total}   TOTAL style= (strict) ${strict}   files with strict>8: ${over}   (target: <=80, no file >8)`)
