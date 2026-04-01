import Panel from '../ui/Panel'

// ── Level helpers ─────────────────────────────────────────────
function level(value, max = 10) {
  if (value / max >= 0.75) return 'High'
  if (value / max >= 0.45) return 'Medium'
  return 'Low'
}

// Returns the raw composite score so Bar can display it proportionally.
// Scale calibrated so that elite overtaking circuits (Monza, Bahrain) ≈ 8–9
// and typical "High" circuits (Miami) land at 7–8 → bar ~80-90 % of max=9.
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

// ── Color maps ────────────────────────────────────────────────
const LEVEL_COLOR = {
  High:   '#e10600',
  Medium: '#f59e0b',
  Low:    '#22c55e',
}

// Gradient start: dark/muted version of each level color
const LEVEL_DARK = {
  High:   'rgba(225,6,0,0.18)',
  Medium: 'rgba(245,158,11,0.18)',
  Low:    'rgba(34,197,94,0.18)',
}

// ── Insight copy ──────────────────────────────────────────────
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

// ── Bar ───────────────────────────────────────────────────────
function Bar({ value, max, lvl }) {
  const pct   = Math.min(Math.max((value / max) * 100, 0), 100)
  const color = LEVEL_COLOR[lvl]
  const dark  = LEVEL_DARK[lvl]

  return (
    <div style={{
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: 'var(--surface-2)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${pct}%`,
        background: `linear-gradient(to right, ${dark}, ${color})`,
        borderRadius: 2,
        transition: 'width 0.6s ease',
      }}>
        {/* 1 px end-marker — visually anchors where the value stops */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 1.5,
          background: 'rgba(255,255,255,0.45)',
          borderRadius: 1,
        }} />
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────
function Row({ label, lvl, insight, value, max, last = false }) {
  return (
    <div style={{
      paddingBottom: '0.85rem',
      marginBottom:  last ? 0 : '0.85rem',
      borderBottom:  last ? 'none' : '1px solid var(--border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          flexShrink: 0,
        }}>
          {label}
        </span>
        <Bar value={value} max={max} lvl={lvl} />
        <span style={{
          fontSize: '0.65rem', fontWeight: 800,
          color: LEVEL_COLOR[lvl],
          minWidth: 44, textAlign: 'right', letterSpacing: '0.04em',
        }}>
          {lvl}
        </span>
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, paddingLeft: 2 }}>
        {insight}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function RaceExpectationsPanel({ specs }) {
  if (!specs) return null

  const tireLvl       = level(specs.tireStress)
  const brakingLvl    = level(specs.braking)
  const overtakingLvl = overtakingLevel(specs.drs, specs.throttle, specs.turns)
  const powerLvl      = level(specs.throttle, 100)
  const ovScore       = calcOvertakingScore(specs.drs, specs.throttle, specs.turns)
  const strategy      = pitStopStrategy(specs.tireStress)

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <span style={{
          fontSize: '0.65rem', color: 'var(--text-muted)',
          fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Race Expectations
        </span>
        <span style={{
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: 4,
          background: 'rgba(245,158,11,0.12)', color: '#FFFFFF',
          border: '1px solid rgb(255,255,255)',
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
        value={Math.max(ovScore, 0)}
        max={9}
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
