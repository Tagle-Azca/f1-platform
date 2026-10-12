import { useEffect, useMemo } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import DriverPortrait from '../components/viz/DriverPortrait'
import ProfileHero, { HeroItem } from '../components/profiles/ProfileHero'
import ProfileSkeleton from '../components/profiles/ProfileSkeleton'
import ProfileNotFound, { ProfileBackLink } from '../components/profiles/ProfileNotFound'
import { notFoundTitle } from '../components/profiles/entityId'
import ProfileError from '../components/profiles/ProfileError'
import StatStrip from '../components/profiles/StatStrip'
import ConnectionsSection from '../components/profiles/ConnectionsSection'
import { TeamLink, TeamStripe } from '../components/profiles/ProfileLinks'
import SeasonTimeline from '../components/profiles/driver/SeasonTimeline'
import TeammateH2H from '../components/profiles/driver/TeammateH2H'
import BestCircuits from '../components/profiles/driver/BestCircuits'
import {
  heroMeta, statStrip, seasonRows, timelineSegments, bestCircuits, h2hSeasons, parseH2hSeason, rangeLabel,
} from '../components/profiles/driver/driverProfileModel'
import { useDriverProfile } from '../hooks/useDriverProfile'
import { teamMark, BASE } from '../styles/vizPalette'
import { cn } from '@/lib/utils'

const chip = 'num inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 text-xs text-ink-2'

function DriverHero({ meta }) {
  const color = teamMark(meta.teamColor, BASE.bg)
  const long = meta.surname.length > 18
  return (
    <ProfileHero
      color={meta.teamColor}
      art={(
        <DriverPortrait
          photoUrl={meta.photoUrl} number={meta.art} color={color}
          className="absolute inset-0 flex items-end justify-center"
          imgClassName="relative h-full w-auto max-w-full object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
        />
      )}
    >
      <HeroItem index={0} className="flex flex-wrap items-center gap-x-pw-2 gap-y-pw-1">
        {meta.number && <span className={chip}>No. {meta.number}</span>}
        {meta.code && <span className="inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 font-display text-xs font-semibold tracking-[0.02em] text-ink-2">{meta.code}</span>}
        {meta.nationality && <span className="text-sm text-ink-2">{meta.nationality}</span>}
      </HeroItem>
      <HeroItem index={1} as="h1" className="max-w-full">
        {meta.given && <span className="block text-base font-normal text-ink-2">{meta.given}</span>}
        <span className={cn('block text-balance pb-1 leading-[1.1] text-ink [overflow-wrap:anywhere]', long ? 'text-title' : 'text-hero')}>{meta.surname}</span>
      </HeroItem>
      {(meta.age !== null || meta.born) && (
        <HeroItem index={2} as="p" className="text-sm text-ink-2">
          {meta.age !== null && <>Age <span className="num">{meta.age}</span></>}
          {meta.age !== null && meta.born && ' · '}
          {meta.born && <>born <span className="num">{meta.born}</span></>}
        </HeroItem>
      )}
      {meta.team && (
        <HeroItem index={3} className="flex flex-wrap items-center gap-x-pw-2">
          <TeamStripe color={color} />
          <TeamLink id={meta.teamId} className="font-display text-base font-medium">{meta.team}</TeamLink>
          {meta.lastSeason && <span className="text-xs text-ink-3">{meta.lastSeason} season</span>}
        </HeroItem>
      )}
    </ProfileHero>
  )
}

export default function DriverProfilePage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const from = location.state?.from
  const [params, setParams] = useSearchParams()
  const d = useDriverProfile(id)
  const ready = d.status === 'ready'

  const meta = useMemo(() => (ready ? heroMeta(d.stats, d.seasons) : null), [ready, d.stats, d.seasons])
  const rows = useMemo(() => seasonRows(d.seasons), [d.seasons])
  const segments = useMemo(() => timelineSegments(d.seasons), [d.seasons])
  const circuits = useMemo(() => bestCircuits(d.circuits), [d.circuits])
  const strip = useMemo(() => (ready ? statStrip(d.stats) : null), [ready, d.stats])
  const h2h = useMemo(() => {
    const fromSeasons = h2hSeasons(d.seasons)
    if (fromSeasons.length) return fromSeasons
    const last = Number(d.stats?.lastSeason)
    return ready && Number.isFinite(last) ? [last] : []
  }, [d.seasons, d.stats, ready])
  const h2hSeason = parseH2hSeason(params.get('h2h'), h2h)

  // An invalid ?h2h= is dropped (replace: no extra history entry)
  const rawH2h = params.get('h2h')
  const invalidH2h = ready && rawH2h !== null && h2hSeason !== null && String(h2hSeason) !== rawH2h
  useEffect(() => {
    if (!invalidH2h) return
    const next = new URLSearchParams(params)
    next.delete('h2h')
    setParams(next, { replace: true })
  }, [invalidH2h]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (d.status === 'notFound') document.title = notFoundTitle('driver')
    else document.title = meta ? `${meta.fullName} · Pitwall` : 'Driver · Pitwall'
  }, [d.status, meta])

  if (d.status === 'notFound') return <ProfileNotFound type="driver" id={id} from={from} />
  if (d.status === 'error') return <ProfileError type="driver" from={from} onRetry={d.retry} />
  if (!ready) {
    return (
      <PageWrapper stagger>
        <h1 className="sr-only">Driver</h1>
        <ProfileBackLink from={from} type="driver" />
        <div className="mt-pw-3"><ProfileSkeleton variant="driver" /></div>
      </PageWrapper>
    )
  }

  const range = rangeLabel(rows.at(-1)?.season, rows[0]?.season) || '2022–2026'
  const h2hColor = rows.find((r) => r.season === h2hSeason)?.color ?? meta.teamColor
  const onH2h = (season) => {
    const next = new URLSearchParams(params)
    next.set('h2h', String(season))
    setParams(next, { replace: true })
  }

  return (
    <PageWrapper stagger>
      <div className="flex flex-col gap-pw-7 lg:gap-pw-8">
        <div className="flex flex-col gap-pw-2">
          <ProfileBackLink from={from} type="driver" />
          <DriverHero meta={meta} />
        </div>
        <Rise index={1}>
          <StatStrip
            id="dp-totals" primary={strip.primary} secondary={strip.secondary}
            caption={`Totals for ${range}, the seasons in Pitwall data.`}
          />
        </Rise>
        <Rise index={2}>
          <SeasonTimeline rows={rows} segments={segments} status={d.seasonsStatus} onRetry={d.retry} />
        </Rise>
        <Rise index={3} className="grid gap-x-pw-8 gap-y-pw-7 [grid-template-columns:repeat(auto-fit,minmax(min(100%,28rem),1fr))]">
          <TeammateH2H
            fullName={meta.fullName} code={meta.code || meta.surname.slice(0, 3).toUpperCase()}
            seasons={h2h} season={h2hSeason} onSeason={onH2h} color={h2hColor}
          />
          <BestCircuits rows={circuits} name={meta.fullName} status={d.circuitsStatus} onRetry={d.retry} />
        </Rise>
        <Rise index={4}>
          <ConnectionsSection type="driver" id={id} name={meta.fullName} />
        </Rise>
      </div>
    </PageWrapper>
  )
}
