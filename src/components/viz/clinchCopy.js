// Sentences for the clinch states, shared by the Standings banner and the Dashboard card (no React).
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

/** "Clinched at Round 17, 5 races early" or "Clinched at the final round"; '' when not clinched. */
export function clinchedLine(clinch) {
  if (!clinch?.clinched || !Number.isFinite(clinch.clinchRound)) return ''
  if (!clinch.racesEarly) return 'Clinched at the final round'
  return `Clinched at Round ${clinch.clinchRound}, ${plural(clinch.racesEarly, 'race', 'races')} early`
}

/** "Final margin: 25 points over Norris. Decided with 3 races to go." (second part only for an early clinch). */
export function marginLine(clinch, runnerLabel) {
  if (!clinch?.clinched) return ''
  const over = runnerLabel ? ` over ${runnerLabel}` : ''
  const early = clinch.racesEarly ? ` Decided with ${plural(clinch.racesEarly, 'race', 'races')} to go.` : ''
  return `Final margin: ${plural(clinch.margin, 'point', 'points')}${over}.${early}`
}

/** "Norris needs 12 more points to clinch." for an open title; '' otherwise. */
export function needsLine(clinch, leaderLabel) {
  if (!clinch || clinch.clinched || !Number.isFinite(clinch.pointsToClinch) || clinch.pointsToClinch < 1) return ''
  return `${leaderLabel} needs ${plural(clinch.pointsToClinch, 'more point', 'more points')} to clinch.`
}
