import EncyclopediaSearch from './EncyclopediaSearch'
import Select from '../ui/Select'
import SegmentedControl from '../ui/SegmentedControl'
import { VIEW_OPTIONS } from './encyclopediaModel'

/**
 * Search, Season and the view control. Search takes its own row below `xl`; from `xl` it shares the row with Season and
 * View when the content is wide enough (plain flex wrap, no media query on the toolbar). Season lists only seasons with data.
 */
export default function EncyclopediaToolbar({ view, onView, season, seasons, onSeason, seasonDisabled }) {
  const options = seasons.map((y) => ({ value: String(y), label: String(y) }))
  return (
    <div className="flex flex-wrap items-end gap-x-pw-4 gap-y-pw-4">
      <EncyclopediaSearch />
      <div className="flex flex-wrap items-end gap-x-pw-4 gap-y-pw-4 max-sm:w-full">
        <div className="flex w-28 shrink-0 flex-col gap-pw-1">
          <label htmlFor="enc-season" className="text-xs text-ink-2">Season</label>
          <Select id="enc-season" value={season == null ? '' : String(season)} onChange={onSeason} options={options} disabled={seasonDisabled || !options.length} placeholder="Season" />
        </div>
        <SegmentedControl
          role="tablist" aria-label="Browse by" options={VIEW_OPTIONS} value={view} onChange={onView}
          controls="encyclopedia-panel" idPrefix="enc-tab" fill className="min-w-0 max-sm:w-full sm:w-80"
        />
      </div>
    </div>
  )
}
