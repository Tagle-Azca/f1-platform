import Panel from '../ui/Panel'
import { ctorColor } from '../../utils/teamColors'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const PODIUM_MEDALS = ['#FFD700', '#C0C0C0', '#CD7F32']

const sectionLabelStyle = {
  fontSize: '0.57rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.25rem',
  paddingBottom: '0.3rem',
  borderBottom: '1px solid var(--border-color)',
}

function PodiumRow({ result, pos }) {
  const medal     = PODIUM_MEDALS[pos - 1]
  const teamColor = ctorColor(result.Constructor?.constructorId)
  const name      = `${result.Driver.givenName} ${result.Driver.familyName}`
  const isLast    = pos === 3

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.55rem',
      padding: '0.42rem 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
    }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: '0.88rem',
        fontWeight: 900,
        color: medal,
        width: 14,
        textAlign: 'right',
        flexShrink: 0,
        lineHeight: 1,
      }}>
        {pos}
      </span>
      <div style={{ width: 3, height: 28, borderRadius: 2, background: teamColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#fff',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.25,
        }}>
          {name}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>
          {result.Constructor?.name}
        </div>
      </div>
    </div>
  )
}

function TechRow({ label, value, extra, ctor, dimExtra = true, last = false }) {
  const valueColor = ctor ? ctorColor(ctor) : '#fff'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      padding: '0.38rem 0',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
    }}>
      {/* Fixed-width label */}
      <span style={{
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        flexShrink: 0,
        width: 54,
      }}>
        {label}
      </span>
      {/* Value — grows to fill, keeps time anchored to the right */}
      <span style={{
        fontSize: '0.8rem',
        fontWeight: 700,
        color: valueColor,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        paddingLeft: '0.5rem',
      }}>
        {value}
      </span>
      {/* Time/extra — always pinned to the right edge */}
      {extra && (
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: dimExtra ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.6)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
          flexShrink: 0,
          marginLeft: 'auto',
          paddingLeft: '0.75rem',
        }}>
          {extra}
        </span>
      )}
    </div>
  )
}

// Abbreviate driver name: "Max Verstappen" → "M. Verstappen"
function abbrev(driver) {
  if (!driver) return '—'
  return `${driver.givenName[0]}. ${driver.familyName}`
}

export default function LastGPPanel({ history }) {
  const { isMobile } = useBreakpoint()
  if (!history?.races?.length) return null

  // Prefer the fully-populated lastRace document (no .select() in the backend query).
  // It guarantees Results.FastestLap, QualifyingResults with Q1/Q2/Q3, and grid fields.
  // Falls back to races[0] for circuits that don't yet have lastRace.
  const last    = history.lastRace || history.races[0]
  const results = last.Results           || []
  const qual    = last.QualifyingResults || []

  // ── Podium ────────────────────────────────────────────
  const p1 = results.find(r => r.position === '1')
  const p2 = results.find(r => r.position === '2')
  const p3 = results.find(r => r.position === '3')
  if (!p1) return null

  // ── Pole position ─────────────────────────────────────
  // Primary source: QualifyingResults (from Jolpica qualifying.json)
  // Fallback: Results[grid === '1'] — same person, no lap time but avoids blank row
  const poleFromQuali = qual.find(r => r.position === '1')
  const poleTime      = poleFromQuali?.Q3 ?? poleFromQuali?.Q2 ?? poleFromQuali?.Q1 ?? null
  const poleResult    = poleFromQuali
    ?? results.find(r => r.grid === '1')   // fallback: race grid position

  // ── Fastest lap ───────────────────────────────────────
  // Primary: rank field (Jolpica stores it as string "1" or number 1 depending on the year)
  let fastest = results.find(r => r.FastestLap?.rank != null && String(r.FastestLap.rank) === '1')

  // Fallback: if rank is missing (some seeds/years don't include it), find the driver
  // with the shortest FastestLap.Time.time by parsing the "m:ss.mmm" format directly.
  if (!fastest) {
    const parseLapTime = t => {
      if (!t) return Infinity
      const [min, sec] = t.split(':')
      return parseFloat(min) * 60 + parseFloat(sec)
    }
    const withTime = results.filter(r => r.FastestLap?.Time?.time)
    if (withTime.length) {
      fastest = withTime.reduce((best, r) =>
        parseLapTime(r.FastestLap.Time.time) < parseLapTime(best.FastestLap.Time.time) ? r : best
      )
    }
  }

  const fastestTime = fastest?.FastestLap?.Time?.time ?? null

  // ── DNFs ──────────────────────────────────────────────
  const dnfs = results.filter(r => {
    const s = r.status || ''
    return s !== 'Finished' && !/^\+\d+/.test(s)
  })

  const raceName = last.raceName?.replace(' Grand Prix', ' GP') ?? '—'

  // Build technical rows — only include rows where we have a value
  const techRows = [
    poleResult ? {
      label: 'Pole',
      value: abbrev(poleResult.Driver),
      extra: poleTime,                          // null if only fallback → nothing shown on right
      ctor:  poleResult.Constructor?.constructorId,
    } : null,
    fastest ? {
      label: 'Fastest',
      value: abbrev(fastest.Driver),
      extra: fastestTime,
      ctor:  fastest.Constructor?.constructorId,
    } : null,
    dnfs.length > 0 ? {
      label: 'DNFs',
      value: String(dnfs.length),
      extra: dnfs.slice(0, 2).map(r => r.Driver.familyName).join(' · '),
      ctor:  null,
    } : null,
  ].filter(Boolean)

  return (
    <Panel
      padding="none"
      style={{
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.25rem',
        height: isMobile ? 'auto' : '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '0.85rem',
      }}>
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Last time here
        </span>
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {last.season} · {raceName}
        </span>
      </div>

      {/* ── Podium ── */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={sectionLabelStyle}>Podium</div>
        {[p1, p2, p3].filter(Boolean).map((r, i) => (
          <PodiumRow key={i} result={r} pos={i + 1} />
        ))}
      </div>

      {/* ── Technical ── */}
      {techRows.length > 0 && (
        <div>
          <div style={sectionLabelStyle}>Technical</div>
          {techRows.map((row, i) => (
            <TechRow
              key={row.label}
              label={row.label}
              value={row.value}
              extra={row.extra}
              ctor={row.ctor}
              last={i === techRows.length - 1}
            />
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />
    </Panel>
  )
}
