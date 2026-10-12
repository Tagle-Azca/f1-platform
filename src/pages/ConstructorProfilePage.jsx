import { useEffect, useMemo } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Rise from '../components/layout/Rise'
import Select from '../components/ui/Select'
import ProfileHero, { HeroItem } from '../components/profiles/ProfileHero'
import ProfileSkeleton from '../components/profiles/ProfileSkeleton'
import ProfileNotFound, { ProfileBackLink } from '../components/profiles/ProfileNotFound'
import { notFoundTitle } from '../components/profiles/entityId'
import ProfileError from '../components/profiles/ProfileError'
import StatStrip from '../components/profiles/StatStrip'
import TeamMark from '../components/profiles/TeamMark'
import ConnectionsSection from '../components/profiles/ConnectionsSection'
import { DriverLink } from '../components/profiles/ProfileLinks'
import SeasonHistory from '../components/profiles/constructor/SeasonHistory'
import TenureStrip from '../components/profiles/constructor/TenureStrip'
import TeamDNA from '../components/profiles/constructor/TeamDNA'
import PointsProgress from '../components/profiles/constructor/PointsProgress'
import TeamRacePace from '../components/profiles/constructor/TeamRacePace'
import {
  teamMeta, titlesLine, kpis, seasonHistory, seasonList, parseSeasonParam, latestDrivers, tenureRows, dnaScores, FINISH_RATE_DEFINITION,
} from '../components/profiles/constructor/constructorProfileModel'
import { useConstructorProfile } from '../hooks/useConstructorProfile'
import { cn } from '@/lib/utils'

const PAIR = 'grid gap-x-pw-8 gap-y-pw-7 [grid-template-columns:repeat(auto-fit,minmax(min(100%,28rem),1fr))]'

export default function ConstructorProfilePage() {
  const { constructorId = '' } = useParams()
  const location = useLocation()
  const from = location.state?.from
  const [params, setParams] = useSearchParams()
  const c = useConstructorProfile(constructorId)
  const ready = c.status === 'ready'
  const data = c.data

  const meta = useMemo(() => teamMeta(data, constructorId), [data, constructorId])
  const history = useMemo(() => seasonHistory(data?.seasons), [data])
  const seasons = useMemo(() => seasonList(data?.seasons), [data])
  const season = parseSeasonParam(params.get('season'), seasons)
  const tenure = useMemo(() => tenureRows(data?.seasons), [data])
  const dna = useMemo(() => dnaScores(data?.stats), [data])
  const strip = useMemo(() => kpis(data?.stats), [data])
  const titles = useMemo(() => titlesLine(data?.stats), [data])
  const drivers = useMemo(() => latestDrivers(data?.seasons), [data])

  // An invalid ?season= is dropped (replace: no extra history entry)
  const raw = params.get('season')
  const invalid = ready && raw !== null && season !== null && String(season) !== raw
  useEffect(() => {
    if (!invalid) return
    const next = new URLSearchParams(params)
    next.delete('season')
    setParams(next, { replace: true })
  }, [invalid]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (c.status === 'notFound') document.title = notFoundTitle('constructor')
    else document.title = ready ? `${meta.name} · Pitwall` : 'Team · Pitwall'
  }, [c.status, ready, meta.name])

  if (c.status === 'notFound') return <ProfileNotFound type="constructor" id={constructorId} from={from} />
  if (c.status === 'error') return <ProfileError type="constructor" from={from} onRetry={c.retry} />
  if (!ready) {
    return (
      <PageWrapper stagger>
        <h1 className="sr-only">Team</h1>
        <ProfileBackLink from={from} type="constructor" />
        <div className="mt-pw-3"><ProfileSkeleton variant="constructor" /></div>
      </PageWrapper>
    )
  }

  const onSeason = (value) => {
    const next = new URLSearchParams(params)
    next.set('season', value)
    setParams(next, { replace: true })
  }
  const options = seasons.map((y) => ({ value: String(y), label: String(y) }))
  const long = meta.name.length > 18
  const caption = meta.range ? `Totals for ${meta.range}, the seasons in Pitwall data.` : 'Totals for the seasons in Pitwall data.'

  return (
    <PageWrapper stagger>
      <div className="flex flex-col gap-pw-7 lg:gap-pw-8">
        <div className="flex flex-col gap-pw-2">
          <ProfileBackLink from={from} type="constructor" />
          <ProfileHero
            color={meta.color}
            art={<TeamMark code={meta.code} color={meta.color} className="absolute inset-0" stripe={false} />}
          >
            <HeroItem index={0} as="h1" className="max-w-full">
              <span className={cn('block text-balance pb-1 leading-[1.1] text-ink [overflow-wrap:anywhere]', long ? 'text-title' : 'text-hero')}>{meta.name}</span>
            </HeroItem>
            {titles && (
              <HeroItem index={1} as="p" className="text-sm text-ink-2">
                {titles.text}{titles.yearsText && <> <span className="num">{titles.yearsText}</span></>}
              </HeroItem>
            )}
            {meta.range && <HeroItem index={2} as="p" className="text-sm text-ink-2">Seasons in data <span className="num">{meta.range}</span></HeroItem>}
            {drivers.drivers.length > 0 && (
              <HeroItem index={3}>
                <p className="text-xs text-ink-3">{drivers.season} drivers</p>
                <ul className="flex flex-wrap gap-x-pw-4">
                  {drivers.drivers.map((dr) => (
                    <li key={dr.id || dr.name}><DriverLink id={dr.id} className="font-display text-base font-medium">{dr.name}</DriverLink></li>
                  ))}
                </ul>
              </HeroItem>
            )}
          </ProfileHero>
        </div>

        <Rise index={1}>
          <StatStrip
            id="cp-totals" primary={strip.primary} secondary={strip.secondary} caption={caption}
            footnote={strip.secondary.some((s) => s.key === 'finishRate') ? FINISH_RATE_DEFINITION : null}
          />
        </Rise>

        {season !== null && (
          <Rise index={2} className="section min-w-0">
            <div className="flex flex-col gap-pw-3 md:flex-row md:items-end md:justify-between">
              <h2 className="text-heading text-ink">{season} season</h2>
              <div className="flex w-28 flex-col gap-pw-1">
                <label htmlFor="cp-season" className="text-xs text-ink-2">Season</label>
                <Select id="cp-season" value={String(season)} onChange={onSeason} options={options} />
              </div>
            </div>
            <div className={cn(PAIR, 'mt-pw-5 [&>section]:border-t-0 [&>section]:pt-0 [&>div>section]:border-t-0 [&>div>section]:pt-0')}>
              <PointsProgress key={`pp-${season}`} constructorId={constructorId} name={meta.name} season={season} color={meta.color} />
              <TeamRacePace key={`rp-${season}`} teamName={meta.name} season={season} color={meta.color} />
            </div>
          </Rise>
        )}

        <Rise index={3}><SeasonHistory rows={history} color={meta.color} /></Rise>
        <Rise index={4} className={PAIR}>
          <TenureStrip columns={tenure.columns} rows={tenure.rows} color={meta.color} />
          <TeamDNA scores={dna} color={meta.color} />
        </Rise>
        <Rise index={5}><ConnectionsSection type="constructor" id={constructorId} name={meta.name} /></Rise>
      </div>
    </PageWrapper>
  )
}
