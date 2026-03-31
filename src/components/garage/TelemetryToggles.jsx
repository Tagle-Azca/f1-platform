import { usePreferences } from '../../contexts/PreferencesContext'

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: on ? '#000' : 'rgba(255,255,255,0.5)',
        transition: 'left 0.2s, background 0.2s',
      }} />
    </button>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 7, overflow: 'hidden',
    }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, padding: '0.35rem 0.5rem', border: 'none', cursor: 'pointer',
              background: active ? 'var(--accent-color)' : 'transparent',
              color: active ? '#000' : 'var(--text-muted)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function Row({ label, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export default function TelemetryToggles() {
  const { draft, setDraft } = usePreferences()

  function setUnit(key, val) {
    setDraft(d => ({ ...d, units: { ...d.units, [key]: val } }))
  }
  function setLayer(key, val) {
    setDraft(d => ({ ...d, dataLayers: { ...d.dataLayers, [key]: val } }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      {/* Units */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <SectionLabel>Telemetry Units</SectionLabel>
        <Row
          label="Speed"
          sub="Velocity displays across all views"
          right={
            <SegmentedControl
              value={draft.units.speed}
              onChange={v => setUnit('speed', v)}
              options={[{ value: 'kmh', label: 'KM/H' }, { value: 'mph', label: 'MPH' }]}
            />
          }
        />
        <Row
          label="Temperature"
          sub="Tyre & ambient temperatures"
          right={
            <SegmentedControl
              value={draft.units.temp}
              onChange={v => setUnit('temp', v)}
              options={[{ value: 'celsius', label: '°C' }, { value: 'fahrenheit', label: '°F' }]}
            />
          }
        />
      </div>

      {/* Data layers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <SectionLabel>Dashboard Data Layers</SectionLabel>
        {[
          { key: 'tireLife',    label: 'Tyre Life',     sub: 'Predicted degradation curves' },
          { key: 'gForce',      label: 'G-Force',       sub: 'Lateral & longitudinal loads' },
          { key: 'drsZones',    label: 'DRS Zones',     sub: 'Activation points on map' },
          { key: 'sectorTimes', label: 'Sector Times',  sub: 'Split breakdown per driver' },
        ].map(({ key, label, sub }) => (
          <Row
            key={key} label={label} sub={sub}
            right={
              <Toggle
                on={draft.dataLayers[key]}
                onChange={v => setLayer(key, v)}
              />
            }
          />
        ))}
      </div>

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
    }}>
      {children}
    </div>
  )
}
