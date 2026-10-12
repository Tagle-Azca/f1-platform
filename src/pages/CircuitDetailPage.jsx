import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import EmptyState from '../components/ui/EmptyState'
import CircuitSkeleton from '../components/circuits/CircuitSkeleton'
import CircuitSpecStrip from '../components/nextrace/CircuitSpecStrip'
import CircuitMapPanel from '../components/nextrace/CircuitMapPanel'
import PoleRecordPanel from '../components/nextrace/PoleRecordPanel'
import CircuitDNAPanel from '../components/circuits/CircuitDNAPanel'
import CircuitHero, { BackLink } from '../components/circuits/CircuitHero'
import CircuitResultsTable from '../components/circuits/CircuitResultsTable'
import CircuitRecords from '../components/circuits/CircuitRecords'
import CarDemandDisclosure from '../components/circuits/CarDemandDisclosure'
import { buttonVariants } from '../components/ui/button-variants'
import { cn } from '@/lib/utils'
import { resultsByYear, circuitRecords, dataSpan } from '../components/circuits/circuitHistoryModel'
import { circuitTitle } from '../components/circuits/circuitFormat'
import { getCircuitSpecs } from '../utils/circuitSpecs'
import { useCircuitDetail } from '../hooks/useCircuitDetail'

const hasStrip = (specs) => Boolean(specs) && ['length', 'turns', 'laps'].some((k) => Number.isFinite(specs[k]))
const cap = (id) => (id.length > 40 ? `${id.slice(0, 40)}…` : id)

function NotFound({ id, from }) {
  return (
    <PageWrapper stagger>
      <BackLink from={from} />
      <h1 className="text-title mt-pw-3 text-ink">Circuit not found</h1>
      <p className="mt-pw-2 text-sm text-ink-2 [overflow-wrap:anywhere]">No circuit has the id &ldquo;{cap(id)}&rdquo;.</p>
      <Link to="/circuits" className={cn(buttonVariants({ size: 'lg' }), 'mt-pw-4 no-underline')}>Browse circuits</Link>
    </PageWrapper>
  )
}

export default function CircuitDetailPage() {
  const { circuitId = '' } = useParams()
  const location = useLocation()
  const from = location.state?.from
  const d = useCircuitDetail(circuitId)
  const { circuit, races, status, historyStatus } = d

  useEffect(() => {
    document.title = status === 'notFound' ? 'Circuit not found · Pitwall' : `${circuit ? circuitTitle(circuit) : 'Circuit'} · Pitwall`
  }, [status, circuit])

  const rows = useMemo(() => resultsByYear(races), [races])
  const records = useMemo(() => circuitRecords(races), [races])
  const span = useMemo(() => dataSpan(races), [races])
  const lastRace = useMemo(() => rows.find((r) => r.hasResult) ?? null, [rows])

  if (status === 'notFound') return <NotFound id={circuitId} from={from} />

  if (status === 'error') {
    return (
      <PageWrapper stagger>
        <BackLink from={from} />
        <EmptyState
          type="error" height={200} message="Circuit could not be loaded"
          action={(
            <>
              <p className="text-sm text-ink-2">Check your connection and try again.</p>
              <button type="button" onClick={d.retry} className="btn btn--primary btn--sentence min-h-11">Try again</button>
            </>
          )}
        />
      </PageWrapper>
    )
  }

  if (!circuit) {
    return (
      <PageWrapper stagger>
        <h1 className="sr-only">Circuit</h1>
        <BackLink from={from} />
        <CircuitSkeleton variant="circuitdetail" name="circuit" className="mt-pw-3" />
      </PageWrapper>
    )
  }

  const specs = getCircuitSpecs(circuit.id)
  const name = circuitTitle(circuit)
  const historyReady = historyStatus === 'ready'
  const noRaces = historyReady && rows.length === 0

  let history
  if (historyStatus === 'loading') history = <CircuitSkeleton variant="circuitdetailresults" name="race history" />
  else if (historyStatus === 'error') {
    history = (
      <div role="alert" className="rounded-md border border-edge px-pw-4 py-pw-3">
        <p className="text-sm text-ink-2">Race history could not be loaded.</p>
        <button type="button" onClick={d.retry} className="btn btn--ghost btn--sentence mt-pw-2 min-h-11">Try again</button>
      </div>
    )
  } else if (noRaces) {
    history = (
      <section className="section">
        <h2 className="text-heading text-ink">Results</h2>
        <p className="mt-pw-2 text-sm text-ink-2">No Grand Prix here in the 2022 to 2026 data yet.</p>
      </section>
    )
  } else {
    history = (
      <>
        <section className="section" aria-labelledby="cd-results">
          <h2 id="cd-results" className="text-heading text-ink">Results</h2>
          <p className="mb-pw-3 mt-pw-1 text-xs text-ink-3">Winners and podiums from our race data.</p>
          <CircuitResultsTable rows={rows} circuitName={name} />
        </section>
        <section className="section" aria-labelledby="cd-records">
          <h2 id="cd-records" className="mb-pw-3 text-heading text-ink">Records</h2>
          <CircuitRecords records={records} />
        </section>
      </>
    )
  }

  const showDna = historyReady && rows.length > 0
  return (
    <PageWrapper stagger>
      <div className="flex flex-col gap-pw-7 lg:gap-pw-8">
        <CircuitHero circuit={circuit} span={span} lastRace={lastRace} cassandraRaceId={d.cassandraRaceId} from={from} />

        {hasStrip(specs) && (
          <Rise index={1} className="section">
            <CircuitSpecStrip specs={specs} />
          </Rise>
        )}

        <Rise index={2} className="flex flex-col gap-pw-7 lg:gap-pw-8">{history}</Rise>

        <Rise index={3} className="grid gap-pw-6 lg:grid-cols-2 lg:items-start">
          {showDna && (
            <section className="panel panel--md" aria-labelledby="cd-dna">
              <h2 id="cd-dna" className="text-heading mb-pw-3 text-ink">Circuit DNA</h2>
              <CircuitDNAPanel circuit={{ circuitId: circuit.id }} theme="viz" bare compact races={races} />
            </section>
          )}
          <CircuitMapPanel lat={circuit.lat} lng={circuit.lng} coords={circuit.coords} animate={false} title="Location" />
        </Rise>

        {specs && !noRaces && (
          <Rise index={4}>
            <CarDemandDisclosure><PoleRecordPanel specs={specs} hideFeatured /></CarDemandDisclosure>
          </Rise>
        )}
      </div>
    </PageWrapper>
  )
}
