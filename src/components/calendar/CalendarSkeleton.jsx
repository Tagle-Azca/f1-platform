import { Skeleton } from '../ui/skeleton'

/** Hero + 8 rows, same heights as the real thing so nothing shifts when data arrives. */
export default function CalendarSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-pw-6">
      <p role="status" className="sr-only">Loading calendar</p>
      <div className="flex flex-col gap-pw-3" aria-hidden="true">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-3/4 max-w-md" />
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-11 w-48" />
      </div>
      <div className="flex flex-col" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="my-pw-1 h-[4.5rem] w-full" />)}
      </div>
    </div>
  )
}
