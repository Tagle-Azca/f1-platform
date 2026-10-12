import { Link } from 'react-router-dom'
import { isValidEntityId } from './entityId'
import { cn } from '@/lib/utils'

const LINK = 'inline-flex min-h-11 items-center text-ink underline decoration-edge underline-offset-4 hover:decoration-ink-3'

/** A team name that links to its profile when the id is safe for a path; plain text otherwise. */
export function TeamLink({ id, children, className = '', state }) {
  if (!isValidEntityId(id)) return <span className={className}>{children}</span>
  return <Link to={`/constructors/${id}`} state={state} className={cn(LINK, className)}>{children}</Link>
}

/** A driver name that links to the profile when the id is safe for a path; plain text otherwise. */
export function DriverLink({ id, children, className = '', state }) {
  if (!isValidEntityId(id)) return <span className={className}>{children}</span>
  return <Link to={`/drivers/${id}`} state={state} className={cn(LINK, className)}>{children}</Link>
}

/** Link-style retry button used by section errors. */
export function RetryButton({ onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-sm font-semibold text-steel hover:text-steel-hi', className)}>
      Try again
    </button>
  )
}

/** One inline row for a section that failed: the heading stays, the rest of the page keeps working. */
export function SectionError({ what, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-x-pw-4 gap-y-pw-1">
      <p className="text-sm text-ink-2">We couldn&apos;t load {what}.</p>
      <RetryButton onClick={onRetry} />
    </div>
  )
}

/** Small 3x12 team stripe used next to team names (graphic, aria-hidden). */
export function TeamStripe({ color, className = '' }) {
  return (
    <svg aria-hidden="true" focusable="false" width="3" height="12" className={cn('shrink-0', className)}>
      <rect width="3" height="12" rx="1.5" fill={color} />
    </svg>
  )
}
