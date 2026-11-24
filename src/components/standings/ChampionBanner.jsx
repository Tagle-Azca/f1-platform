import Panel from '../ui/Panel'
import DriverPortrait from '../viz/DriverPortrait'
import { clinchedLine } from '../viz/clinchCopy'
import { teamMark } from '../../styles/vizPalette'
import { safeHttpsUrl } from '../../utils/safeUrl'

/**
 * Champion banner: shown once the title is mathematically decided (and always for a finished season).
 * `champion` is the standings row (kind, id, name, team, color, number); `clinch` is clinchModel output.
 */
export default function ChampionBanner({ champion, clinch, photo, season }) {
  if (!champion || !clinch?.clinched) return null
  const isCtor = champion.kind === 'constructor'
  const color = teamMark(champion.color)
  const photoUrl = isCtor ? null : safeHttpsUrl(photo?.photoUrl)
  const number = isCtor ? '' : (champion.number || photo?.number || '')
  const line = clinchedLine(clinch)
  const name = <h2 className="font-display text-xl font-bold leading-tight text-gold md:text-2xl">{champion.name}</h2>
  return (
    <Panel as="section" aria-label={`${season} ${isCtor ? 'constructors' : 'drivers'} champion`} data-champion-banner className="relative overflow-hidden">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="champ-glow" cx="12%" cy="50%" r="55%"><stop offset="0" stopColor={color} stopOpacity="0.24" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#champ-glow)" />
      </svg>
      <div className="relative flex items-center gap-pw-4">
        {!isCtor && (
          <DriverPortrait
            photoUrl={photoUrl} number={number} color={color}
            className="relative flex size-20 shrink-0 items-end justify-center md:size-28"
            imgClassName="relative size-20 object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_72%,transparent)] md:size-28"
          />
        )}
        <div className="flex min-w-0 flex-col items-start gap-pw-1">
          <span className="inline-flex min-h-6 items-center rounded-pill bg-gold-soft px-pw-3 text-xs font-medium text-gold">
            {season} {isCtor ? 'constructors' : 'drivers'} champion
          </span>
          {name}
          <span className="flex items-center gap-pw-2 text-sm text-ink-2">
            <svg aria-hidden="true" focusable="false" width="3" height="12" className="shrink-0"><rect width="3" height="12" rx="1.5" fill={color} /></svg>
            <span className="truncate">{isCtor ? `${champion.wins} ${champion.wins === 1 ? 'win' : 'wins'}` : champion.team}</span>
          </span>
          <p className="text-sm font-medium text-ink">{line}</p>
        </div>
      </div>
    </Panel>
  )
}
