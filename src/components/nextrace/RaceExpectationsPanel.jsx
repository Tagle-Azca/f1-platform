import Panel from '../ui/Panel'

function level(value, max = 10) {
  if (value / max >= 0.75) return 'High'
  if (value / max >= 0.45) return 'Medium'
  return 'Low'
}

function overtakingLevel(drs, throttle, turns) {
  // More DRS zones + high throttle + fewer turns = easier overtaking
  const score = (drs * 2) + (throttle / 20) - (turns / 8)
  if (score >= 6)  return 'High'
  if (score >= 3)  return 'Medium'
  return 'Low'
}

function pitStopStrategy(tireStress, laps) {
  if (tireStress >= 8) return '2-stop likely'
  if (tireStress >= 6) return '1–2 stop'
  return '1-stop likely'
}

const LEVEL_COLOR = {
  High:   '#e10600',
  Medium: '#f59e0b',
  Low:    '#22c55e',
}

const INSIGHTS = {
  tireDeg: {
    High:   'Tires drop off fast — strategy calls will make or break the race',
    Medium: 'Deg is manageable — timing the undercut right separates the field',
    Low:    'Stable rubber — track position wins, clean air beats fresh tires',
  },
  braking: {
    High:   'Punishing stop-go layout — brake cooling and stability are non-negotiable',
    Medium: 'Braking is a differentiator — setup trade-offs between low and high speed',
    Low:    'Aero-efficient circuit — power delivery and top-speed trim are key',
  },
  overtaking: {
    High:   'Passing lanes open — race pace wins here, grid slots matter less',
    Medium: 'A few windows to overtake — strategy can still flip the order',
    Low:    'Qualifying counts double — once in clean air, holding position is everything',
  },
  power: {
    High:   'Full-throttle lap — ERS deployment and engine modes under the spotlight',
    Medium: 'Balanced circuit — no specialist wins here, no weakness goes unpunished',
    Low:    'Mechanical grip wins — downforce and setup matter more than engine power',
  },
}

function Bar({ value, max = 10 }) {
  const pct = Math.round((value / max) * 100)
  const color = pct >= 75 ? '#e10600' : pct >= 45 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function Row({ label, lvl, insight, value, max, last = false }) {
  const color = LEVEL_COLOR[lvl]
  return (
    <div style={{ paddingBottom: '0.85rem', marginBottom: last ? 0 : '0.85rem', borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>
          {label}
        </span>
        <Bar value={value} max={max} />
        <span style={{ fontSize: '0.65rem', fontWeight: 800, color, minWidth: 44, textAlign: 'right', letterSpacing: '0.04em' }}>
          {lvl}
        </span>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, paddingLeft: 2 }}>
        {insight}
      </p>
    </div>
  )
}

export default function RaceExpectationsPanel({ specs }) {
  if (!specs) return null

  const tireLvl      = level(specs.tireStress)
  const brakingLvl   = level(specs.braking)
  const overtakingLvl = overtakingLevel(specs.drs, specs.throttle, specs.turns)
  const powerLvl     = level(specs.throttle, 100)
  const strategy     = pitStopStrategy(specs.tireStress, specs.laps)

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Race Expectations
        </span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: 4,
          background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.25)',
        }}>
          {strategy}
        </span>
      </div>

      <Row
        label="Tire deg"
        lvl={tireLvl}
        insight={INSIGHTS.tireDeg[tireLvl]}
        value={specs.tireStress}
        max={10}
      />
      <Row
        label="Braking"
        lvl={brakingLvl}
        insight={INSIGHTS.braking[brakingLvl]}
        value={specs.braking}
        max={10}
      />
      <Row
        label="Overtaking"
        lvl={overtakingLvl}
        insight={INSIGHTS.overtaking[overtakingLvl]}
        value={specs.drs * 2.5}
        max={10}
      />
      <Row
        label="Power lap"
        lvl={powerLvl}
        insight={INSIGHTS.power[powerLvl]}
        value={specs.throttle}
        max={100}
        last
      />
    </Panel>
  )
}
