import CircuitDNAPanel from '../circuits/CircuitDNAPanel'
import CircuitMapPanel from '../nextrace/CircuitMapPanel'
import CircuitSpecStrip from '../nextrace/CircuitSpecStrip'
import LastGPPanel from '../nextrace/LastGPPanel'
import PoleRecordPanel from '../nextrace/PoleRecordPanel'
import RaceExpectationsPanel from '../nextrace/RaceExpectationsPanel'
import SectionDisclosure from '../nextrace/SectionDisclosure'
import StrategyOutlookPanel from '../nextrace/StrategyOutlookPanel'

/** Circuit facts (specs, pole record, expectations, strategy) beside the last race here. Each half renders only with data. */
export function CircuitFacts({ specs, history }) {
  if (!specs && !history) return null
  return (
    <div className="grid grid-cols-1 items-start gap-x-pw-6 gap-y-pw-7 lg:grid-cols-12">
      {specs && (
        <section className="section min-w-0 lg:col-span-7" aria-labelledby="circuit-h">
          <h2 id="circuit-h" className="text-heading mb-pw-4 text-ink">The circuit</h2>
          <CircuitSpecStrip specs={specs} />
          <PoleRecordPanel specs={specs} hideFeatured />
          <div className="mt-pw-6 grid grid-cols-1 gap-x-pw-6 gap-y-pw-6 md:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">What to expect</h3>
              <RaceExpectationsPanel specs={specs} />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Strategy</h3>
              <StrategyOutlookPanel specs={specs} />
            </div>
          </div>
        </section>
      )}
      {history && (
        <section className="section min-w-0 lg:col-span-5" aria-labelledby="last-gp-h">
          <h2 id="last-gp-h" className="text-heading mb-pw-4 text-ink">Last time here</h2>
          <LastGPPanel history={history} />
        </section>
      )}
    </div>
  )
}

/** The circuit map (loaded on request) and Circuit DNA (collapsed). */
export function MapAndDna({ circuit, circuitId, collapsible = false }) {
  const lat = circuit?.Location?.lat
  const lng = circuit?.Location?.long
  if (!(lat && lng) && !circuitId) return null
  return (
    <div className="grid grid-cols-1 items-start gap-x-pw-6 gap-y-pw-7 lg:grid-cols-12">
      {lat && lng && <div className="min-w-0 lg:col-span-6"><CircuitMapPanel lat={lat} lng={lng} coords={circuit?.trackCoords} /></div>}
      {circuitId && (
        <div className="min-w-0 lg:col-span-6">
          <SectionDisclosure title="Circuit DNA" alwaysCollapsible={collapsible}>
            <CircuitDNAPanel circuit={{ circuitId }} compact theme="viz" bare />
          </SectionDisclosure>
        </div>
      )}
    </div>
  )
}
