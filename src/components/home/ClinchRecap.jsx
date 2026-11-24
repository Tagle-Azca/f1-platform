import LeadChart from '../viz/LeadChart'
import SecondPlaceBattle from './SecondPlaceBattle'
import { marginLine, clinchedLine } from '../viz/clinchCopy'

/** "How it was decided": lead over P2 round by round with the clinch marked, the final margin, then the fight for P2. */
export default function ClinchRecap({ clinch, series, color, runnerLabel, championLabel }) {
  const roundsLeft = Math.max(0, clinch.totalRounds - clinch.roundsDone)
  const label = `${championLabel}'s lead over ${runnerLabel} after each round, from round 1 to round ${clinch.roundsDone}. ${clinchedLine(clinch)}.`
  return (
    <div data-clinch-recap className="mt-pw-4 border-t border-edge-soft pt-pw-3">
      <h3 className="mb-pw-2 text-xs text-ink-3">How it was decided</h3>
      <LeadChart points={clinch.leadSeries} total={clinch.totalRounds} clinchRound={clinch.clinchRound} color={color} label={label} />
      <p className="mt-pw-2 text-sm text-ink-2">{marginLine(clinch, runnerLabel)}</p>
      <SecondPlaceBattle series={series} championId={clinch.champion.id} roundsLeft={roundsLeft} />
    </div>
  )
}
