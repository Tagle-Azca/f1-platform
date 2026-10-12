function stops(tireStress) {
  if (tireStress >= 8) return ['2-stop',      'High deg forces two stops. Cliff avoidance will split the field']
  if (tireStress >= 6) return ['1 or 2-stop', 'On the knife-edge. A VSC or SC will force teams\' hands']
  return                      ['1-stop',      'Rubber holds. Track position rules, overcut is a weapon']
}
function undercut(braking, tireStress) {
  if (tireStress >= 7 && braking >= 7) return ['Very effective', 'Deg opens a wide pit window, fresh rubber closes gaps fast']
  if (tireStress >= 5)                 return ['Effective',      'Used tires bleed time, a well-timed stop puts you ahead']
  return                                      ['Weak',           'Clean air beats fresh rubber here, overcut is the real weapon']
}
function safetyCar(turns, tireStress) {
  if (turns >= 19 || tireStress >= 8) return ['High',   'Expect at least one SC or VSC to shake up the strategy board']
  if (turns >= 15)                    return ['Medium', 'Incidents possible, one SC could rewrite the whole race']
  return                                     ['Low',    'Open circuit, the strategy you start with is likely the one you finish with']
}
function tireNote(tireStress) {
  if (tireStress >= 8) return ['Severe',     'Thermal deg is severe. Managing the cliff will be the difference-maker']
  if (tireStress >= 6) return ['Manageable', 'Deg is real but car balance on the rears will split the field']
  return                      ['Consistent', 'No cliff, no drama. Stint length is the weapon']
}

function Item({ label, value, detail }) {
  return (
    <div className="py-pw-2 border-b border-edge-soft last:border-b-0">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
      <dd className="text-xs text-ink-2 leading-5">{detail}</dd>
    </div>
  )
}

export default function StrategyOutlookPanel({ specs }) {
  if (!specs) return null
  const [s, sd] = stops(specs.tireStress)
  const [t, td] = tireNote(specs.tireStress)
  const [u, ud] = undercut(specs.braking, specs.tireStress)
  const [c, cd] = safetyCar(specs.turns, specs.tireStress)
  return (
    <dl>
      <Item label="Expected stops" value={s} detail={sd} />
      <Item label="Tire behavior"  value={t} detail={td} />
      <Item label="Undercut"       value={u} detail={ud} />
      <Item label="Safety car"     value={c} detail={cd} />
    </dl>
  )
}
