import { useState } from 'react'
import HeadToHeadBar from '../viz/HeadToHeadBar'
import SegmentedControl from '../ui/SegmentedControl'
import Select from '../ui/Select'
import { buttonVariants } from '../ui/button-variants'
import { useTeammateH2H } from '../../hooks/useTeammateH2H'
import { h2hView } from '../profiles/driver/driverProfileModel'
import { codeFromName } from '../../utils/driverCode'
import { teamMark, BASE } from '../../styles/vizPalette'
import { cn } from '@/lib/utils'
import { safeString } from '../../utils/safeText'

const MAX_SEGMENTS = 5
const fold = (s) => safeString(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * Same garage: race and qualifying head to head per shared season. `fullNameA` must be the exact full name the API uses
 * (taken from the partner's teammates[]); null shows the unavailable state instead of guessing. The API compares a driver
 * with their teammate of that season, so the answer is only shown when that teammate is the other driver of this matchup.
 */
export default function SameGarage({ fullNameA, nameB, seasons, color }) {
  const [picked, setPicked] = useState(null)
  const season = seasons.includes(picked) ? picked : seasons[seasons.length - 1] ?? null
  const h = useTeammateH2H(fullNameA, season)
  const view = h.status === 'ready' ? h2hView(h.data, { driverName: fullNameA, season }) : null
  const sameMate = view?.status === 'ok' && fold(view.teammate) === fold(nameB)
  const bar = teamMark(color, BASE.bg)
  const options = seasons.map((y) => ({ value: String(y), label: String(y) }))
  const gap = Number.isFinite(h.data?.avgQualiGapSeconds) ? Math.abs(h.data.avgQualiGapSeconds) : null

  let body
  if (!fullNameA || season === null) {
    body = <p className="text-sm text-ink-2">Season comparison unavailable.</p>
  } else if (h.status === 'error') {
    body = (
      <div role="alert" className="flex flex-wrap items-center gap-x-pw-4">
        <p className="text-sm text-ink-2">We couldn&apos;t load the comparison.</p>
        <button type="button" onClick={h.retry} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>
      </div>
    )
  } else if (!view) {
    body = <div aria-hidden="true" className="viz-pulse h-24 rounded-md bg-edge-soft" />
  } else if (!sameMate) {
    body = <p className="text-sm text-ink-2">Season comparison unavailable.</p>
  } else {
    const rows = [['Race', view.race, 'races'], ['Qualifying', view.quali, 'sessions']].filter(([, s]) => s.total > 0)
    body = (
      <div className="flex flex-col gap-pw-4" data-h2h-rows>
        {rows.map(([label, s, unit]) => (
          <div key={label}>
            <p className="text-sm text-ink-2">{label}</p>
            <div aria-hidden="true">
              <HeadToHeadBar left={{ code: codeFromName(fullNameA), value: s.driver }} right={{ code: codeFromName(view.teammate), value: s.teammate }} color={bar} max={s.total} caption={`of ${s.total} ${unit} compared`} />
            </div>
          </div>
        ))}
        {gap !== null && <p className="num text-xs text-ink-3">Average qualifying gap {gap.toFixed(3)} s</p>}
      </div>
    )
  }

  return (
    <section className="section min-w-0" aria-labelledby="teammates-garage-h">
      <h2 id="teammates-garage-h" className="text-heading text-ink">Same garage</h2>
      {seasons.length > 0 && season !== null && (
        <div className="mt-pw-3 max-w-md">
          {seasons.length <= MAX_SEGMENTS ? (
            <SegmentedControl role="radiogroup" aria-label="Season" options={options} value={String(season)} onChange={(v) => setPicked(Number(v))} fill />
          ) : (
            <div className="flex w-28 flex-col gap-pw-1">
              <label htmlFor="teammates-garage-season" className="text-xs text-ink-2">Season</label>
              <Select id="teammates-garage-season" value={String(season)} onChange={(v) => setPicked(Number(v))} options={options} />
            </div>
          )}
        </div>
      )}
      <div className="mt-pw-4" aria-busy={h.status === 'loading' || undefined}>{body}</div>
      <div role="status" className="sr-only">{sameMate ? view.sentence : ''}</div>
    </section>
  )
}
