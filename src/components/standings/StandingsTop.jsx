import { useMemo } from 'react'
import StandingsHero from './StandingsHero'
import ChampionBanner from './ChampionBanner'
import { useChampion } from './useChampion'

/**
 * Top of the Standings page: the champion banner once the title is decided (at or after the clinch round of the
 * replay), then the podium. Before the clinch the podium is the plain title fight; after it, the battle for P2.
 */
export default function StandingsTop({ view, season, hero, photos, datasetKey, source, onOpenConstructor, series, rounds, info, round }) {
  const { clinch, decided, champion } = useChampion({ series, rounds, totalRounds: info.totalRounds, season, view, round })
  const shownHero = useMemo(() => (decided && hero.kind === 'fight' ? { ...hero, clinched: true } : hero), [decided, hero])
  return (
    <div className="flex flex-col gap-pw-4">
      {champion && <ChampionBanner champion={champion} clinch={clinch} photo={photos?.get(champion.id)} season={season} />}
      <StandingsHero view={view} season={season} hero={shownHero} photos={photos} datasetKey={datasetKey} source={source} onOpenConstructor={onOpenConstructor} />
    </div>
  )
}
