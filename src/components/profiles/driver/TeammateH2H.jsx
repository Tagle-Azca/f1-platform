import { useState } from 'react'
import HeadToHeadBar from '../../viz/HeadToHeadBar'
import { BarsSkeleton } from '../ProfileSkeleton'
import SegmentedControl from '../../ui/SegmentedControl'
import Select from '../../ui/Select'
import { RetryButton } from '../ProfileLinks'
import { useTeammateH2H } from '../../../hooks/useTeammateH2H'
import { codeFromName } from '../../../utils/driverCode'
import { teamMark, BASE } from '../../../styles/vizPalette'
import { h2hView } from './driverProfileModel'

const MAX_SEGMENTS = 5

function Rows({ view, code, mateCode, color }) {
  const bar = teamMark(color, BASE.bg)
  const rows = [['Race', view.race, 'races'], ['Qualifying', view.quali, 'sessions']].filter(([, s]) => s.total > 0)
  return (
    <div className="flex flex-col gap-pw-4" data-h2h-rows>
      {rows.map(([label, s, unit]) => (
        <div key={label}>
          <p className="text-sm text-ink-2">{label}</p>
          <div aria-hidden="true">
            <HeadToHeadBar
              left={{ code, value: s.driver }} right={{ code: mateCode, value: s.teammate }}
              color={bar} max={s.total} caption={`of ${s.total} ${unit} compared`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Teammate head to head for one season: a Race row and a Qualifying row of mirrored bars scaled to the compared total.
 * The season control is a radiogroup up to five seasons, a Select beyond. The previous bars stay while another season loads.
 */
export default function TeammateH2H({ fullName, code, seasons, season, onSeason, color }) {
  const h = useTeammateH2H(fullName, season)
  const key = `${fullName}|${season}`
  const view = h.status === 'ready' ? h2hView(h.data, { driverName: fullName, season }) : null
  const [last, setLast] = useState(null)
  if (view && last?.key !== key) setLast({ key, view })
  const shown = view ?? last?.view ?? null
  const busy = h.status === 'loading'
  const options = seasons.map((y) => ({ value: String(y), label: String(y) }))

  let body
  if (season == null) {
    body = <p className="text-sm text-ink-2">No seasons to compare yet.</p>
  } else if (h.status === 'error') {
    body = (
      <div role="alert" className="flex flex-wrap items-center gap-x-pw-4">
        <p className="text-sm text-ink-2">We couldn&apos;t load the comparison.</p>
        <RetryButton onClick={h.retry} />
      </div>
    )
  } else if (!shown) {
    body = <BarsSkeleton />
  } else if (shown.status !== 'ok') {
    body = (
      <div>
        <p className="text-sm text-ink-2">No teammate comparison for {shown.season}.</p>
        <p className="mt-pw-1 text-xs text-ink-3">
          {shown.status === 'noTeammate' ? `No teammate in Pitwall data for ${shown.season}.` : `Not enough shared races in ${shown.season}.`}
        </p>
      </div>
    )
  } else {
    body = (
      <>
        <p className="mb-pw-3 text-xs text-ink-3">Compared with {shown.teammate} in {shown.season}.</p>
        <Rows view={shown} code={code} mateCode={codeFromName(shown.teammate)} color={color} />
      </>
    )
  }

  return (
    <section className="section min-w-0" aria-labelledby="dp-h2h">
      <h2 id="dp-h2h" className="text-heading text-ink">Against teammates</h2>
      {seasons.length > 0 && season != null && (
        <div className="mt-pw-3 max-w-md">
          {seasons.length <= MAX_SEGMENTS ? (
            <SegmentedControl role="radiogroup" aria-label="Season" options={options} value={String(season)} onChange={(v) => onSeason(Number(v))} fill />
          ) : (
            <div className="flex w-28 flex-col gap-pw-1">
              <label htmlFor="dp-h2h-season" className="text-xs text-ink-2">Season</label>
              <Select id="dp-h2h-season" value={String(season)} onChange={(v) => onSeason(Number(v))} options={options} />
            </div>
          )}
        </div>
      )}
      <div className="mt-pw-4" aria-busy={busy || undefined}>{body}</div>
      <div role="status" className="sr-only">{view && view.status === 'ok' ? view.sentence : ''}</div>
    </section>
  )
}
