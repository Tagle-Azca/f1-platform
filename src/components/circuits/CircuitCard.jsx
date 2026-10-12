import { memo, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Flag from '../ui/Flag'
import TypeChip from './TypeChip'
import CircuitArt from './CircuitArt'
import { cardSpecs, specsLine, describeCircuit, circuitTitle, placeLine, hasOutline, NOT_IN_DATA } from './circuitFormat'
import { riseProps, useReducedMotion } from '../../styles/motion'

const LINK =
  'group relative block rounded-md border border-edge bg-panel no-underline outline-none transition-colors duration-150 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel ' +
  'active:translate-y-px motion-reduce:transition-none [@media(hover:hover)]:hover:bg-raise'

function RoundChip({ circuit, next, className = '' }) {
  if (circuit.calendarRound == null) return null
  return next ? (
    <span aria-hidden="true" className={`num inline-flex min-h-6 items-center rounded-pill bg-steel-soft px-pw-3 text-xs text-steel ${className}`}>Next, round {circuit.calendarRound}</span>
  ) : (
    <span aria-hidden="true" className={`num inline-flex min-h-6 items-center rounded-pill border border-edge bg-panel px-pw-3 text-xs text-ink-2 ${className}`}>Round {circuit.calendarRound}</span>
  )
}

function Place({ circuit, className = '' }) {
  const place = placeLine(circuit)
  if (!place) return null
  return (
    <p className={`flex min-w-0 items-center gap-pw-2 text-ink-2 ${className}`}>
      <Flag country={circuit.country} />
      <span className="min-w-0 truncate">{place}</span>
    </p>
  )
}

/**
 * One circuit: the whole card is a single link named by the circuit name only (the rest is its description).
 * `layout="row"` below 640px (96x72 outline on the left), `"portrait"` from 640px. Outlines are static.
 */
function CircuitCard({ circuit, season, layout = 'portrait', next = false, index = 0, entrance = false, linkState }) {
  const reduced = useReducedMotion()
  const nameId = useId()
  const descId = useId()
  const outline = hasOutline(circuit)
  const title = circuitTitle(circuit)
  const specs = cardSpecs(circuit)
  const motionProps = entrance && !reduced ? riseProps(index + 2, false) : {}
  const edge = next ? 'border-t-2 border-t-steel' : ''

  return (
    <motion.li className="min-w-0" {...motionProps}>
      <Link
        to={`/circuits/${circuit.id}`} state={linkState}
        aria-labelledby={nameId} aria-describedby={descId}
        data-circuit-card={circuit.id} data-next={next || undefined}
        className={`${LINK} ${edge} ${layout === 'row' ? 'flex min-h-24 gap-pw-3 p-pw-3' : 'flex h-full flex-col p-pw-4'}`}
      >
        <span id={descId} className="sr-only">{describeCircuit(circuit, season, outline)}</span>
        {layout === 'row' ? (
          <>
            <div className="relative aspect-[4/3] w-24 shrink-0 self-start overflow-hidden rounded-md border border-edge-soft bg-bg p-pw-2 text-ink-2 transition-colors duration-150 group-hover:text-ink motion-reduce:transition-none">
              <CircuitArt circuit={circuit} size="row" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-pw-1">
              <span id={nameId} className="line-clamp-2 font-display text-[15px] font-semibold leading-[19px] text-ink [overflow-wrap:anywhere]">{title}</span>
              <Place circuit={circuit} className="text-[13px]" />
              <div className="flex min-w-0 flex-wrap items-center gap-x-pw-3 gap-y-pw-1">
                <TypeChip type={circuit.type} />
                <RoundChip circuit={circuit} next={next} />
              </div>
              <p className="num text-ink-3 [overflow-wrap:anywhere]" aria-hidden="true">{specsLine(circuit)}</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative aspect-[26/17] overflow-hidden rounded-md border border-edge-soft bg-bg p-pw-4 text-ink-2 transition-colors duration-150 group-hover:text-ink motion-reduce:transition-none">
              <CircuitArt circuit={circuit} size="card" />
              <RoundChip circuit={circuit} next={next} className="absolute right-pw-2 top-pw-2" />
            </div>
            <span id={nameId} className="mt-pw-3 line-clamp-2 min-h-10 font-display text-base font-semibold leading-5 text-ink [overflow-wrap:anywhere]">{title}</span>
            <Place circuit={circuit} className="mt-pw-1 text-sm" />
            <div className="mt-pw-2 flex min-w-0 flex-wrap items-center justify-between gap-x-pw-3 gap-y-pw-1">
              <TypeChip type={circuit.type} />
              {!circuit.calendarOnly && circuit.lastSeason != null && <span className="text-xs text-ink-3">Last GP <span className="num">{circuit.lastSeason}</span></span>}
            </div>
            <div className="mt-auto pt-pw-3" aria-hidden="true">
              <div className="border-t border-edge-soft pt-pw-3">
                {circuit.calendarOnly ? (
                  <p className="text-xs text-ink-3">{NOT_IN_DATA}</p>
                ) : specs.length > 0 && (
                  <dl className="grid grid-flow-col auto-cols-fr divide-x divide-edge-soft">
                    {specs.map((sp, i) => (
                      <div key={sp.key} className={`min-w-0 ${i === 0 ? 'pr-pw-2' : 'px-pw-2'}`}>
                        <dd className="num text-[15px] font-medium text-ink">{sp.value}{sp.unit && <span className="ml-0.5 font-sans text-xs text-ink-3">{sp.unit}</span>}</dd>
                        <dt className="text-xs text-ink-3">{sp.label}</dt>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          </>
        )}
      </Link>
    </motion.li>
  )
}

export default memo(CircuitCard)
