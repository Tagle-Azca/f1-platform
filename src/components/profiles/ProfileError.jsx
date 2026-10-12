import { Link } from 'react-router-dom'
import PageWrapper from '../layout/PageWrapper'
import { buttonVariants } from '../ui/button-variants'
import { ProfileBackLink } from './ProfileNotFound'
import { cn } from '@/lib/utils'

/** Page-level failure (the main request failed with something other than a 404). */
export default function ProfileError({ type = 'driver', from, onRetry }) {
  const what = type === 'constructor' ? 'team' : 'driver'
  return (
    <PageWrapper stagger>
      <ProfileBackLink from={from} type={type} />
      <div role="alert" className="mt-pw-3">
        <h1 className="text-title text-ink">We couldn&apos;t load this {what}</h1>
        <p className="mt-pw-2 text-sm text-ink-2">Check your connection and try again.</p>
        <div className="mt-pw-4 flex flex-wrap items-center gap-pw-3">
          <button type="button" onClick={onRetry} className={cn(buttonVariants({ size: 'lg' }))}>Try again</button>
          <Link to={`/encyclopedia?view=${type === 'constructor' ? 'constructors' : 'drivers'}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-steel no-underline hover:text-steel-hi">Back to the encyclopedia</Link>
        </div>
      </div>
    </PageWrapper>
  )
}
