import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DriverPortrait from '../viz/DriverPortrait'
import { CARD_LINK, WELL_CLASS } from '../encyclopedia/cardParts'
import { getDriverPhotos } from '../../hooks/useStandingsData'
import { ctorColor, teamMark, BASE } from '../../styles/vizPalette'
import { cn } from '@/lib/utils'
import { FEATURED, MATCHUP_FILTERS, MATCHUP_PREVIEW, MATCHUPS, PRESET_NAMES } from './constants'
import { filterMatchups, matchupHref, surname } from './teammatesModel'

// One-row touch carousel on phones (no wrap, hidden scrollbar); wraps inline from md.
const CAROUSEL = 'flex snap-x gap-pw-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible'
const PILL = 'inline-flex min-h-11 shrink-0 snap-start cursor-pointer items-center gap-pw-2 whitespace-nowrap rounded-pill border px-pw-3 text-sm'
const IMG = 'relative h-full w-auto max-w-full object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_75%,transparent)]'

function Mark({ constructorId }) {
  return (
    <svg aria-hidden="true" focusable="false" width="3" height="12" className="shrink-0">
      <rect width="3" height="12" rx="1.5" fill={teamMark(ctorColor(constructorId))} />
    </svg>
  )
}

/** Headshots by driver id, shared with Standings and the Encyclopedia (one request per session). */
function usePhotos() {
  const [photos, setPhotos] = useState(() => new Map())
  useEffect(() => {
    let alive = true
    getDriverPhotos().then((m) => { if (alive) setPhotos(m) })
    return () => { alive = false }
  }, [])
  return photos
}

function Side({ id, ctor, photos }) {
  const photo = photos.get(id)
  const color = teamMark(ctorColor(ctor), BASE.bg)
  const art = photo?.number || photo?.code || surname(PRESET_NAMES[id]).slice(0, 2).toUpperCase()
  return (
    <div className={cn(WELL_CLASS, 'h-24 flex-1')}>
      <DriverPortrait photoUrl={photo?.photoUrl} number={art} color={color} className="absolute inset-0 flex items-end justify-center" imgClassName={IMG} />
      <svg aria-hidden="true" focusable="false" viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[3px] w-full">
        <rect width="1" height="1" fill={color} />
      </svg>
    </div>
  )
}

function MatchupCard({ m, photos }) {
  return (
    <li className="min-w-0">
      <Link to={matchupHref(m.a, m.b)} className={cn(CARD_LINK, 'flex min-h-[11rem] flex-col gap-pw-3 p-pw-3')}>
        <div className="flex items-center gap-pw-2" aria-hidden="true">
          <Side id={m.a} ctor={m.ctorA} photos={photos} />
          <span className="font-display text-sm font-black italic text-ink-3">VS</span>
          <Side id={m.b} ctor={m.ctorB} photos={photos} />
        </div>
        <div className="flex min-w-0 flex-col gap-pw-1">
          <span className="text-xs font-medium text-ink-3">{m.tag}</span>
          <span className="font-display text-base font-semibold leading-5 text-ink">{surname(PRESET_NAMES[m.a])} vs {surname(PRESET_NAMES[m.b])}</span>
          <span className="flex items-center gap-pw-2 text-xs text-ink-2">
            <Mark constructorId={m.ctorA} />
            {m.ctorB !== m.ctorA && <Mark constructorId={m.ctorB} />}
            <span className="min-w-0 truncate">{m.teams}, <span className="num">{m.years}</span></span>
          </span>
        </div>
      </Link>
    </li>
  )
}

/**
 * Featured matchups: filter pills, then a card grid (3 / 2 / 1 columns) capped at MATCHUP_PREVIEW until "View all".
 * `exclude` is the pair on screen ([a, b]) so the feed never offers the matchup already open.
 */
export default function MatchupPresets({ heading = 'Popular matchups', exclude = [] }) {
  const photos = usePhotos()
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const items = filterMatchups(MATCHUPS, filter, exclude)
  const visible = expanded ? items : items.slice(0, MATCHUP_PREVIEW)
  const hidden = items.length - visible.length

  return (
    <section className="section min-w-0" aria-labelledby="teammates-presets-h">
      <h2 id="teammates-presets-h" className="text-heading mb-pw-3 text-ink">{heading}</h2>
      <div role="group" aria-label="Filter matchups" className={cn(CAROUSEL, 'mb-pw-4')}>
        {MATCHUP_FILTERS.map((f) => {
          const on = f.id === filter
          return (
            <button
              key={f.id} type="button" aria-pressed={on} onClick={() => { setFilter(f.id); setExpanded(false) }}
              className={cn(PILL, on ? 'border-steel bg-raise font-semibold text-ink' : 'border-edge bg-transparent text-ink-2 hover:bg-hover hover:text-ink')}
            >
              {f.label}
            </button>
          )
        })}
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-ink-2">No other matchups in this group.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-pw-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => <MatchupCard key={`${m.a}-${m.b}`} m={m} photos={photos} />)}
        </ul>
      )}
      {hidden > 0 && (
        <button type="button" onClick={() => setExpanded(true)} className={cn(PILL, 'mt-pw-4 border-edge bg-transparent font-semibold text-steel hover:bg-hover')}>
          View all rivalries <span className="num text-ink-3">({items.length})</span>
        </button>
      )}
    </section>
  )
}

/** "Start from a driver" chips: a one-row carousel on phones. Choosing one fills the first driver and focuses the second. */
export function DriverChips({ onPick, exclude = [] }) {
  return (
    <section className="section min-w-0" aria-labelledby="teammates-chips-h">
      <h2 id="teammates-chips-h" className="text-heading mb-pw-3 text-ink">Start from a driver</h2>
      <ul className={CAROUSEL}>
        {FEATURED.filter((d) => !exclude.includes(d.driverId)).map((d) => (
          <li key={d.driverId} className="shrink-0 snap-start">
            <button type="button" onClick={() => onPick(d)} className={cn(PILL, 'border-edge bg-transparent text-ink hover:bg-hover')}>
              <Mark constructorId={d.constructorId} />
              {d.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
