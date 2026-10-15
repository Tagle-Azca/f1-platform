import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageWrapper from '../layout/PageWrapper'
import { buttonVariants } from '../ui/button-variants'
import { isValidEntityId, backTarget } from './entityId'
import { cn } from '@/lib/utils'

const COPY = {
  driver: { title: 'Driver not found', what: 'driver', cta: 'Browse drivers', tab: 'drivers' },
  constructor: { title: 'Team not found', what: 'team', cta: 'Browse constructors', tab: 'constructors' },
}

export function ProfileBackLink({ from, type }) {
  const { to, label } = backTarget(from, type === 'constructor' ? 'constructors' : 'drivers')
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-pw-2 text-sm font-semibold text-steel no-underline hover:text-steel-hi">
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </Link>
  )
}

/**
 * Designed not-found page. A malformed id (for example "<script>" or its encoded form) is never echoed back:
 * only an id that is already safe for a path is shown, in the mono numeral style.
 */
export default function ProfileNotFound({ type = 'driver', id, from }) {
  const c = COPY[type] ?? COPY.driver
  return (
    <PageWrapper stagger>
      <ProfileBackLink from={from} type={type} />
      <h1 className="text-title mt-pw-3 text-ink">{c.title}</h1>
      <p className="mt-pw-2 max-w-prose text-sm text-ink-2">
        We couldn&apos;t find that {c.what} in Pitwall data for 2022–2026.
        {isValidEntityId(id) && <> The id was <span className="num [overflow-wrap:anywhere]">{id}</span>.</>}
      </p>
      <Link to={`/drivers?view=${c.tab}`} className={cn(buttonVariants({ size: 'lg' }), 'mt-pw-4 no-underline')}>{c.cta}</Link>
    </PageWrapper>
  )
}
