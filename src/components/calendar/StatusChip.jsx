import { Check } from 'lucide-react'
import LivePill from '../ui/LivePill'

const BASE = 'inline-flex min-h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-pw-3 text-xs font-medium'

/** Round status in words (icon is decoration): done | live | next | upcoming. `weekend` turns Next into "This weekend". */
export default function StatusChip({ status, weekend = false }) {
  if (status === 'live') return <LivePill>Live now</LivePill>
  if (status === 'next') return <span className={`${BASE} border border-steel text-steel`}>{weekend ? 'This weekend' : 'Next'}</span>
  if (status === 'done') return <span className={`${BASE} px-0 text-ink-3`}><Check aria-hidden="true" className="size-3" />Completed</span>
  return <span className={`${BASE} px-0 text-ink-3`}>Upcoming</span>
}
