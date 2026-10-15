import { useId } from 'react'
import { ArrowDown } from 'lucide-react'
import Select from '../ui/Select'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { TZ_OPTIONS } from '../../utils/timezone'

/** Season, time zone and "Jump to next round" (rendered only when there is a round to jump to). */
export default function CalendarToolbar({ season, seasons, onSeason, tz, onTz, canJump, onJump }) {
  const sid = useId()
  const zid = useId()
  return (
    <div className="flex flex-col gap-pw-3 md:flex-row md:flex-wrap md:items-end">
      <div className="flex flex-col gap-1 md:w-36">
        <label htmlFor={sid} className="text-xs text-ink-2">Season</label>
        <Select id={sid} value={season} onChange={onSeason} options={seasons} />
      </div>
      <div className="flex flex-col gap-1 md:w-64">
        <label htmlFor={zid} className="text-xs text-ink-2">Times in</label>
        <Select id={zid} value={tz} onChange={onTz} options={TZ_OPTIONS} />
      </div>
      {canJump && (
        <button type="button" className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 cursor-pointer gap-pw-2 px-pw-3')} onClick={onJump}>
          <ArrowDown aria-hidden="true" />Jump to next round
        </button>
      )}
    </div>
  )
}
