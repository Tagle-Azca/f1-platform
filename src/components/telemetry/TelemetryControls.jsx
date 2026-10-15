import Select from '../ui/Select'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'

function Field({ id, label, busy, className = '', children }) {
  return (
    <div className={`flex min-w-0 flex-col gap-pw-1 ${className}`}>
      <label htmlFor={id} className="flex items-center gap-pw-2 text-xs text-ink-2">
        {label}
        {busy && <span className="text-ink-3">Loading</span>}
      </label>
      {children}
    </div>
  )
}

const driverOption = (d, favoriteDriverId, withTeam) => {
  const fav = d.driverId === favoriteDriverId
  const name = d.acronym ? `${d.acronym}, ${d.fullName}` : d.name
  return `${fav ? '★ ' : ''}${name}${fav ? ' (your driver)' : withTeam && d.teamName ? `, ${d.teamName}` : ''}`
}

/** Driver pickers and the Load button. Season and race live in the Race analysis page header. */
export default function TelemetryControls({
  isHistorical,
  raceId,
  driverId, onDriverChange,
  histDrivers, cassDrivers, loadingDrivers, loadingHist,
  driverIdB, onDriverBChange, laps, loadingB,
  loading, onLoad,
  favoriteDriverId,
}) {
  const drivers = isHistorical ? histDrivers : cassDrivers
  const busy = loading || loadingHist
  const canLoad = isHistorical ? driverId && !loadingHist : raceId && driverId && !loading

  return (
    <form
      className="grid grid-cols-1 gap-pw-3 md:flex md:flex-wrap md:items-end"
      onSubmit={e => { e.preventDefault(); if (canLoad) onLoad() }}
      aria-label="Telemetry selection"
    >
      <Field id="tel-driver" label="Driver" busy={loadingDrivers || loadingHist} className="md:w-72">
        <Select
          id="tel-driver" value={driverId} onChange={onDriverChange} placeholder="Select a driver"
          disabled={!drivers.length || loadingDrivers}
          options={drivers.map(d => ({ value: d.driverId, label: driverOption(d, favoriteDriverId, !isHistorical) }))}
        />
      </Field>

      {!isHistorical && laps.length > 0 && (
        <Field id="tel-driver-b" label="Compare with" busy={loadingB} className="md:w-64">
          <Select
            id="tel-driver-b" value={driverIdB} onChange={onDriverBChange}
            disabled={!cassDrivers.length}
            options={[
              { value: '', label: 'No comparison' },
              ...cassDrivers.filter(d => d.driverId !== driverId).map(d => ({ value: d.driverId, label: driverOption(d, favoriteDriverId, false) })),
            ]}
          />
        </Field>
      )}

      <button type="submit" className={cn(buttonVariants(), 'min-h-11 disabled:cursor-not-allowed disabled:opacity-50 md:min-h-9')} disabled={!canLoad}>
        {busy ? 'Loading' : isHistorical ? 'Load season' : 'Load telemetry'}
      </button>
    </form>
  )
}
