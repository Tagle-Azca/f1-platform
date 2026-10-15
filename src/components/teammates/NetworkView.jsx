import { Link } from 'react-router-dom'
import { Swords } from 'lucide-react'
import Panel from '../ui/Panel'
import EmptyState from '../ui/EmptyState'
import VizSkeleton from '../viz/VizSkeleton'
import StatStrip from '../profiles/StatStrip'
import ConnectionsSection from '../profiles/ConnectionsSection'
import { buttonVariants } from '../ui/button-variants'
import DriverCombobox from './DriverCombobox'
import { DriverChips } from './MatchupPresets'
import { Filled } from './MatchupHero'
import { DATA_RANGE, FOOTNOTE, matchupHref, networkStats, seasonRange, surname } from './teammatesModel'
import { cn } from '@/lib/utils'

function TeamsList({ teams }) {
  const rows = [...teams].filter((t) => t && typeof t.name === 'string')
    .sort((x, y) => String(x.seasons?.[0] ?? '9999').localeCompare(String(y.seasons?.[0] ?? '9999')))
  return (
    <section className="section min-w-0" aria-labelledby="network-teams-h">
      <h2 id="network-teams-h" className="text-heading mb-pw-3 text-ink">Teams <span className="num text-ink-3">{rows.length}</span></h2>
      {rows.length === 0 ? <p className="text-sm text-ink-2">No teams in Pitwall data.</p> : (
        <ul>
          {rows.map((t) => (
            <li key={t.constructorId ?? t.name} className="flex min-h-11 items-baseline justify-between gap-pw-3 border-t border-edge-soft py-pw-2 text-sm">
              <span className="min-w-0 truncate text-ink">{t.name}</span>
              <span className="num shrink-0 text-xs text-ink-3">{seasonRange(t.seasons)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function TeammatesList({ id, teammates }) {
  const rows = [...teammates].filter((t) => t && typeof t.driverId === 'string')
    .sort((x, y) => (Array.isArray(y.seasons) ? y.seasons.length : 0) - (Array.isArray(x.seasons) ? x.seasons.length : 0))
  return (
    <section className="section min-w-0" aria-labelledby="network-mates-h">
      <h2 id="network-mates-h" className="text-heading mb-pw-3 text-ink">Teammates <span className="num text-ink-3">{rows.length}</span></h2>
      {rows.length === 0 ? <p className="text-sm text-ink-2">No teammates recorded for this driver.</p> : (
        <ul>
          {rows.map((t) => (
            <li key={t.driverId} className="flex flex-wrap items-center justify-between gap-x-pw-3 gap-y-pw-1 border-t border-edge-soft py-pw-2">
              <Link to={`/drivers/${encodeURIComponent(t.driverId)}`} className="flex min-h-11 min-w-0 flex-col justify-center no-underline hover:text-steel-hi">
                <span className="truncate text-sm text-ink">{t.name}</span>
                <span className="text-xs text-ink-3"><span className="num">{seasonRange(t.seasons)}</span>{Array.isArray(t.teams) && t.teams[0] ? `, ${t.teams[0]}` : ''}</span>
              </Link>
              <Link to={matchupHref(id, t.driverId)} aria-label={`Compare with ${surname(t.name)}`} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 no-underline')}>
                <Swords aria-hidden="true" size={16} />
                Compare with {surname(t.name)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Rivalries > Network: one driver's career network. Picker, six-figure strip, the force graph (loaded straight away),
 * and the Teams and Teammates lists, which carry every relationship of the graph for keyboard and screen readers.
 * `slot` is the page's slot object for the driver ({ id, name, status, data, retry }).
 */
export default function NetworkView({ slot, onPick, onRemove, focusSlot, onChip }) {
  const { id, name, status, data } = slot
  const stats = data?.stats ? networkStats(data.stats) : null

  return (
    <div aria-busy={status === 'loading' || undefined} className="flex min-w-0 flex-col gap-pw-6">
      <Panel as="section" aria-label="Driver">
        {id ? (
          <Filled slot={slot} align="items-start text-left" onRemove={onRemove} />
        ) : (
          <DriverCombobox
            id="network-pick" label="Driver" placeholder="Search for a driver"
            onPick={onPick} autoFocus={focusSlot === 'a'}
          />
        )}
      </Panel>

      {!id && (
        <>
          <EmptyState type="empty" message="Pick a driver to see their network" height={80} />
          <DriverChips onPick={onChip} />
        </>
      )}

      {id && status === 'loading' && <VizSkeleton variant="rows" name="driver network" count={4} />}
      {id && status === 'nodata' && <p className="text-sm text-ink-2">No race data for this driver in Pitwall.</p>}

      {id && status === 'ready' && (
        <>
          {stats && (stats.primary.length > 0 || stats.secondary.length > 0) && (
            <StatStrip id="network-stats" title="Career" caption={`${surname(name)}, ${DATA_RANGE}.`} primary={stats.primary} secondary={stats.secondary} />
          )}
          <ConnectionsSection key={id} type="driver" id={id} name={name} autoShow />
          <div className="grid min-w-0 gap-pw-6 md:grid-cols-2">
            <TeamsList teams={data.teams} />
            <TeammatesList id={id} teammates={data.teammates} />
          </div>
          <p className="text-xs text-ink-3">{FOOTNOTE}</p>
        </>
      )}
    </div>
  )
}
