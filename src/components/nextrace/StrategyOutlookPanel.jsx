import Panel from '../ui/Panel'
import { useBreakpoint } from '../../hooks/useBreakpoint'

function stops(tireStress) {
  if (tireStress >= 8) return { label: '2-stop',       detail: 'High deg forces two stops — cliff avoidance will split the field' }
  if (tireStress >= 6) return { label: '1 or 2-stop',  detail: 'On the knife-edge — a VSC or SC will force teams\' hands' }
  return                       { label: '1-stop',       detail: 'Rubber holds — track position rules, overcut is a weapon' }
}

function undercut(braking, tireStress) {
  if (tireStress >= 7 && braking >= 7) return 'Very effective — deg opens a wide pit window, fresh rubber closes gaps fast'
  if (tireStress >= 5)                 return 'Effective — used tires bleed time, a well-timed stop puts you ahead'
  return                                       'Weak — clean air beats fresh rubber here, overcut is the real weapon'
}

function safetyCar(turns, tireStress) {
  if (turns >= 19 || tireStress >= 8) return 'High — expect at least one SC or VSC to shake up the strategy board'
  if (turns >= 15)                    return 'Medium — incidents possible, one SC could rewrite the whole race'
  return                                      'Low — open circuit, the strategy you start with is likely the one you finish with'
}

function tireNote(tireStress) {
  if (tireStress >= 8) return 'Thermal deg is severe — managing the cliff will be the difference-maker'
  if (tireStress >= 6) return 'Deg is real but manageable — car balance on the rears will split the field'
  return                       'Consistent all race — no cliff, no drama. Stint length is the weapon'
}

function IconFlag() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 11, height: 11 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 9m0 6V9" />
    </svg>
  )
}

function Row({ label, value, detail, last = false, isMobile }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '110px 1fr',
      gap: isMobile ? '0.15rem' : '0.5rem',
      padding: '0.5rem 0',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)',
      alignItems: 'start',
    }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingTop: isMobile ? 0 : 1 }}>
        {label}
      </span>
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' }}>{value}</div>
        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{detail}</div>
      </div>
    </div>
  )
}

export default function StrategyOutlookPanel({ specs }) {
  const { isMobile } = useBreakpoint()
  if (!specs) return null

  const stopInfo  = stops(specs.tireStress)
  const underInfo = undercut(specs.braking, specs.tireStress)
  const scInfo    = safetyCar(specs.turns, specs.tireStress)
  const tireInfo  = tireNote(specs.tireStress)

  return (
    <Panel padding="none" style={{ padding: '1rem 1.25rem', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', flexShrink: 0 }}>
        <span style={{ color: 'var(--text-muted)' }}><IconFlag /></span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Strategy Outlook
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: isMobile ? 'flex-start' : 'space-between' }}>
        <Row isMobile={isMobile} label="Expected stops" value={stopInfo.label}  detail={stopInfo.detail} />
        <Row isMobile={isMobile} label="Tire behavior"  value={tireInfo.split('—')[0].trim()} detail={tireInfo.split('—')[1]?.trim()} />
        <Row isMobile={isMobile} label="Undercut"       value={underInfo.split('—')[0].trim()} detail={underInfo.split('—')[1]?.trim()} />
        <Row isMobile={isMobile} label="Safety car"     value={scInfo.split('—')[0].trim()} detail={scInfo.split('—')[1]?.trim()} last />
      </div>
    </Panel>
  )
}
