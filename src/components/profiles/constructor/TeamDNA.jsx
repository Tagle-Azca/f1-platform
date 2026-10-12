import GapBar from '../../viz/GapBar'
import { DNA_CAPTION } from './constructorProfileModel'

/** Team DNA: four literal rates (0-100%) as labelled share bars. Under five races there is nothing honest to show. */
export default function TeamDNA({ scores, color }) {
  return (
    <section className="section min-w-0" aria-labelledby="cp-dna">
      <h2 id="cp-dna" className="text-heading text-ink">Team DNA</h2>
      <p className="mt-pw-1 text-xs text-ink-3">{DNA_CAPTION}</p>
      {!scores ? (
        <p className="mt-pw-3 text-sm text-ink-2">Not enough results yet. Rates need at least 5 races.</p>
      ) : (
        <ul className="mt-pw-4 flex flex-col gap-pw-4">
          {scores.map((s, i) => (
            <li key={s.key}>
              <div className="flex items-baseline justify-between gap-pw-3">
                <span className="text-sm text-ink-2">{s.label}</span>
                <span className="num text-[15px] font-medium text-ink">{s.value.toFixed(1)}%</span>
              </div>
              <div className="mt-pw-1"><GapBar value={s.value} max={100} mode="share" color={color} height={8} index={i} /></div>
              <p className="mt-pw-1 text-xs text-ink-3">{s.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
