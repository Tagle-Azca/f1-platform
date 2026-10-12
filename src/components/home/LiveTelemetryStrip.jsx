import { useEffect, useState } from 'react'
import { telemetryApi } from '../../services/api'
import Meter from '../ui/Meter'

const MAX_RPM = 15000
const POLL_MS = 1000

// RPM zones: green 0-9000, red 9000-11000, steel above 11000 (static: no blinking).
function rpmTone(rpm) {
  if (rpm > 11000) return 'bg-steel'
  if (rpm > 9000)  return 'bg-neg'
  return 'bg-pos'
}

function VerticalBar({ value, tone, label }) {
  const pct = Math.min(100, value ?? 0)
  return (
    <div className="flex w-8 flex-col items-center gap-1 text-xs text-ink-2">
      <span>{label}</span>
      <Meter value={pct} tone={tone} vertical className="flex-1" />
      <span className="num">{Math.round(pct)}</span>
    </div>
  )
}

export default function LiveTelemetryStrip({ driverNum, driverName }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!driverNum) return
    let cancelled = false
    const poll = async () => {
      try {
        const resp = await telemetryApi.getCarData()
        if (cancelled) return
        const t = resp?.telemetry?.[driverNum]
        if (t) setData(t)
      } catch { /* keep last known */ }
    }
    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [driverNum])

  if (!driverNum) return null

  const gear   = data?.gear ?? null
  const rpm    = data?.rpm ?? 0
  const rpmPct = Math.min(100, (rpm / MAX_RPM) * 100)

  return (
    <div className="border-t border-edge-soft bg-sidebar p-pw-3">
      <p className="mb-pw-2 text-xs text-ink-2">Telemetry{driverName ? `: ${driverName}` : ''}</p>
      <div className="mb-pw-2">
        <Meter value={rpmPct} tone={rpmTone(rpm)} />
        <div className="num mt-1 flex justify-between text-xs text-ink-2">
          <span>0</span>
          <span>{rpm ? `${rpm.toLocaleString()} RPM` : '—'}</span>
        </div>
      </div>
      <div className="flex h-16 items-stretch gap-pw-3">
        <VerticalBar value={data?.throttle ?? 0} tone="bg-pos" label="T" />
        <div className="flex flex-1 flex-col items-center justify-center">
          <span className="text-stat leading-none text-ink">
            {gear == null ? '—' : gear === 0 ? 'N' : gear}
          </span>
          <span className="text-xs font-medium text-ink-2">Gear</span>
        </div>
        <VerticalBar value={data?.brake ?? 0} tone="bg-neg" label="B" />
      </div>
    </div>
  )
}
