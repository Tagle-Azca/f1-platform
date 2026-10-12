import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Flag from '../ui/Flag'
import TypeChip from './TypeChip'
import CircuitArt from './CircuitArt'
import { buttonVariants } from '../ui/button-variants'
import { cn } from '@/lib/utils'
import { formatCoords, hasOutline, placeLine, circuitTitle } from './circuitFormat'
import { heroMeta, backTarget } from './circuitUiModel'
import { safeHttpsUrl } from '../../utils/safeUrl'
import { heroChildProps, riseProps, useReducedMotion } from '../../styles/motion'

export function BackLink({ from }) {
  return (
    <Link to={backTarget(from)} className="inline-flex min-h-11 items-center gap-pw-2 text-sm font-semibold text-steel no-underline hover:text-steel-hi">
      <ArrowLeft size={16} aria-hidden="true" />
      All circuits
    </Link>
  )
}

/**
 * Detail hero: the one display-size element. Outline panel with a single draw-in (or the fallback tile) beside the text
 * from lg, above it below lg. DOM order keeps the text first.
 */
export default function CircuitHero({ circuit, span, lastRace, cassandraRaceId, from }) {
  const reduced = useReducedMotion()
  const name = circuitTitle(circuit)
  const outline = hasOutline(circuit)
  const coords = formatCoords(circuit.lat, circuit.lng)
  const wiki = safeHttpsUrl(circuit.url)
  const meta = heroMeta(circuit, span, lastRace)
  const place = placeLine(circuit)
  const long = name.length > 30

  return (
    <header className="flex flex-col gap-pw-2">
      <motion.div {...heroChildProps(0, reduced)}><BackLink from={from} /></motion.div>
      <div className="grid gap-pw-5 lg:grid-cols-2 lg:items-center lg:gap-pw-6">
        <div className="flex min-w-0 flex-col items-start gap-pw-3">
          <motion.div {...heroChildProps(1, reduced)} className="flex flex-wrap items-center gap-x-pw-3 gap-y-pw-1">
            <TypeChip type={circuit.type} />
            {circuit.region && circuit.region !== 'Other' && <span className="text-sm text-ink-3">{circuit.region}</span>}
          </motion.div>
          <motion.h1 {...heroChildProps(2, reduced)} className={cn('max-w-full text-balance text-ink [overflow-wrap:anywhere]', long ? 'text-title' : 'text-hero')}>{name}</motion.h1>
          {place && (
            <motion.p {...heroChildProps(3, reduced)} className="flex items-center gap-pw-2 text-base text-ink-2">
              <Flag country={circuit.country} />{place}
            </motion.p>
          )}
          <motion.p {...heroChildProps(4, reduced)} className="text-sm text-ink-2">
            {meta.kind === 'data' ? (
              <>
                {meta.first != null && <>In data since <span className="num">{meta.first}</span> · </>}
                Last GP <span className="num">{meta.season}</span>{meta.race ? `, ${meta.race}` : ''}
              </>
            ) : meta.text}
          </motion.p>
          <motion.div {...heroChildProps(5, reduced)} className="flex flex-wrap gap-pw-3">
            {cassandraRaceId && (
              <Link to={`/telemetry?race=${cassandraRaceId}`} aria-label={`Compare laps at ${name}`} className={cn(buttonVariants({ size: 'lg' }), 'no-underline')}>Compare laps</Link>
            )}
            {wiki && (
              <a href={wiki} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'no-underline')}>
                Wikipedia
                <ArrowUpRight size={14} aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </motion.div>
        </div>

        <motion.div {...riseProps(0, reduced)} className="panel panel--sm order-first flex aspect-[3/2] max-h-60 flex-col md:panel--md lg:order-none lg:max-h-none">
          <div className="min-h-0 flex-1 text-ink">
            <CircuitArt circuit={circuit} size="hero" animate width={420} height={280} caption />
          </div>
          {outline && (
            <div className="mt-pw-2 flex items-end justify-between gap-pw-3 text-xs text-ink-3">
              <span className="num">{coords}</span>
              <span className="inline-flex items-center gap-pw-2"><span aria-hidden="true" className="size-1.5 rounded-pill bg-steel" />Start and finish</span>
            </div>
          )}
        </motion.div>
      </div>
    </header>
  )
}
