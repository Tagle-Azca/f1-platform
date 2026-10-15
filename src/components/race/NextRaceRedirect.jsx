import { Link, Navigate } from 'react-router-dom'
import PageWrapper from '../layout/PageWrapper'
import EmptyState from '../ui/EmptyState'
import WeekendSkeleton from './WeekendSkeleton'
import { buttonVariants } from '../ui/button-variants'
import { nextRaceLoader } from '../../hooks/useRaceWeekend'
import { useLoaded } from '../../hooks/entityLoader'
import { weekendPathFor } from '../../utils/weekendPath'
import { cn } from '@/lib/utils'

/**
 * Legacy `/next-race`: resolves the next round from the dashboard and replaces the URL with its race weekend page.
 * No next round goes to the calendar; a failed request shows Retry and a calendar link (the URL stays).
 */
export default function NextRaceRedirect() {
  const { value, retry } = useLoaded(nextRaceLoader, 'next', true)
  if (!value) return <WeekendSkeleton label="Finding the next race weekend" />
  if (value.status === 'error') {
    return (
      <PageWrapper stagger>
        <h1 className="text-title mb-pw-3 text-ink">Next race</h1>
        <EmptyState
          type="error" message="Race data is unavailable right now." height={160}
          action={(
            <div className="flex flex-wrap items-center justify-center gap-pw-3">
              <button type="button" onClick={retry} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11')}>Try again</button>
              <Link to="/calendar" className={cn(buttonVariants(), 'min-h-11 no-underline')}>Open the calendar</Link>
            </div>
          )}
        />
      </PageWrapper>
    )
  }
  return <Navigate replace to={weekendPathFor(value.nextRace)} />
}
