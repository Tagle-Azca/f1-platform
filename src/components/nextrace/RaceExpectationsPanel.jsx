import Meter from '../ui/Meter'

function level(value, max = 10) {
  if (value / max >= 0.75) return 'High'
  if (value / max >= 0.45) return 'Medium'
  return 'Low'
}

// Composite overtaking score, calibrated so elite circuits (Monza, Bahrain) land at 8-9.
function calcOvertakingScore(drs, throttle, turns) {
  return (drs * 2) + (throttle / 20) - (turns / 8)
}
function overtakingLevel(drs, throttle, turns) {
  const s = calcOvertakingScore(drs, throttle, turns)
  if (s >= 6) return 'High'
  if (s >= 3) return 'Medium'
  return 'Low'
}
function pitStopStrategy(tireStress) {
  if (tireStress >= 8) return '2-stop likely'
  if (tireStress >= 6) return '1–2 stop'
  return '1-stop likely'
}

const INSIGHTS = {
  tireDeg: {
    High:   'Tires drop off fast. Strategy calls will make or break the race',
    Medium: 'Deg is manageable. Timing the undercut right separates the field',
    Low:    'Stable rubber. Track position wins, clean air beats fresh tires',
  },
  braking: {
    High:   'Punishing stop-go layout. Brake cooling and stability are non-negotiable',
    Medium: 'Braking is a differentiator. Setup trade-offs between low and high speed',
    Low:    'Aero-efficient circuit. Power delivery and top-speed trim are key',
  },
  overtaking: {
    High:   'Passing lanes open. Race pace wins here, grid slots matter less',
    Medium: 'A few windows to overtake. Strategy can still flip the order',
    Low:    'Qualifying counts double. Once in clean air, holding position is everything',
  },
  power: {
    High:   'Full-throttle lap. ERS deployment and engine modes under the spotlight',
    Medium: 'Balanced circuit. No specialist wins here, no weakness goes unpunished',
    Low:    'Mechanical grip wins. Downforce and setup matter more than engine power',
  },
}

function Row({ label, lvl, insight, value, max }) {
  return (
    <div className="py-pw-3 border-b border-edge-soft last:border-b-0">
      <div className="flex items-center gap-pw-3 mb-pw-1">
        <span className="w-24 shrink-0 text-sm font-medium text-ink-2">{label}</span>
        <Meter value={(value / max) * 100} tone="bg-steel" className="flex-1" />
        <span className="w-14 text-right text-sm font-semibold text-ink">{lvl}</span>
      </div>
      <p className="text-xs text-ink-2 leading-5">{insight}</p>
    </div>
  )
}

export default function RaceExpectationsPanel({ specs }) {
  if (!specs) return null
  const tireLvl       = level(specs.tireStress)
  const brakingLvl    = level(specs.braking)
  const overtakingLvl = overtakingLevel(specs.drs, specs.throttle, specs.turns)
  const powerLvl      = level(specs.throttle, 100)
  const ovScore       = calcOvertakingScore(specs.drs, specs.throttle, specs.turns)

  return (
    <div>
      <p className="mb-pw-1 inline-block rounded-pill border border-edge px-pw-3 py-0.5 text-xs font-semibold text-ink">
        {pitStopStrategy(specs.tireStress)}
      </p>
      <Row label="Tire deg"   lvl={tireLvl}       insight={INSIGHTS.tireDeg[tireLvl]}         value={specs.tireStress}        max={10} />
      <Row label="Braking"    lvl={brakingLvl}    insight={INSIGHTS.braking[brakingLvl]}      value={specs.braking}           max={10} />
      <Row label="Overtaking" lvl={overtakingLvl} insight={INSIGHTS.overtaking[overtakingLvl]} value={Math.max(ovScore, 0)}   max={9} />
      <Row label="Power lap"  lvl={powerLvl}      insight={INSIGHTS.power[powerLvl]}          value={specs.throttle}          max={100} />
    </div>
  )
}
