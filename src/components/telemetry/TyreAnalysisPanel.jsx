import TyreBadge from '../ui/TyreBadge'
import TelemetrySection from './TelemetrySection'
import { degradTone, DEGRAD_LIMIT_MS } from './telemetryUtils'
import { tyre } from '../../styles/vizPalette'

/**
 * One row per stint: compound, lap range drawn on a shared race-length track, and the
 * degradation trend as a number plus a word (never color alone).
 */
export default function TyreAnalysisPanel({ stintAnalysis, totalLaps }) {
  const lastLap = totalLaps || Math.max(...stintAnalysis.map(s => s.lapEnd), 1)

  return (
    <TelemetrySection
      id="stints-h"
      title="Tyre stints"
      caption="Degradation is the lap-time trend within a stint; safety car and pit laps are left out."
    >
      <ol className="flex flex-col">
        {stintAnalysis.map(s => {
          const t    = tyre(s.compound)
          const tone = degradTone(s.degradMs)
          const left  = ((s.lapStart - 1) / lastLap) * 100
          const width = Math.max(1, (s.lapCount / lastLap) * 100)
          return (
            <li key={s.index} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-pw-3 gap-y-pw-2 border-b border-edge-soft py-pw-3 last:border-b-0">
              <TyreBadge compound={s.compound} size={22} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {t ? t.name : 'Unknown'} <span className="font-normal text-ink-3">· laps {s.lapStart}–{s.lapEnd}</span>
                </p>
                <div className="relative mt-pw-2 h-1.5 rounded-[2px] bg-[var(--viz-track)]" aria-hidden="true">
                  <div
                    className="absolute inset-y-0 rounded-[2px]"
                    style={{ left: `${left}%`, width: `${width}%`, background: t?.css ?? 'var(--pw-ink-3)' }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="num text-ink">{s.degradMs == null || Math.abs(s.degradMs) > DEGRAD_LIMIT_MS ? '—' : `${s.degradMs > 0 ? '+' : ''}${s.degradMs} ms/lap`}</p>
                <p className={`text-xs ${tone.cls}`}>{tone.word}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </TelemetrySection>
  )
}
