import { useId } from 'react'
import { motion } from 'framer-motion'
import Panel from '../ui/Panel'
import { teamMark, BASE } from '../../styles/vizPalette'
import { DUR, EASE_OUT, heroChildProps, useReducedMotion } from '../../styles/motion'
import { cn } from '@/lib/utils'

/**
 * Shared profile hero: one Panel with a 4px team stripe on its top edge, the text stack on the left and the art on
 * the right from `md` (art on top below it). The art slot is decorative (aria-hidden) and slides in once.
 * Children of `text` are positioned by the caller; use `HeroItem` to give them the staggered entrance.
 */
export default function ProfileHero({ color, art, children, className = '' }) {
  const reduced = useReducedMotion()
  const gradId = useId().replace(/:/g, '')
  const mark = teamMark(color, BASE.panel)
  const enter = reduced ? { initial: false } : {
    initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, transition: { duration: DUR.enter, ease: EASE_OUT, delay: 0.1 },
  }
  return (
    <Panel as="header" padding="none" className={cn('relative overflow-hidden p-pw-4 md:p-pw-6', className)} data-profile-hero>
      <svg aria-hidden="true" focusable="false" className="absolute inset-x-0 top-0 block h-1 w-full"><rect width="100%" height="4" fill={mark} /></svg>
      <div className="relative grid items-center gap-pw-4 pt-pw-1 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-pw-6">
        <div className="flex min-w-0 flex-col items-start gap-pw-2 md:order-1">{children}</div>
        <motion.div aria-hidden="true" {...enter} className="relative order-first h-40 md:order-2 md:h-56 lg:h-72">
          <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <radialGradient id={gradId} cx="50%" cy="35%" r="45%"><stop offset="0" stopColor={mark} stopOpacity="0.18" /><stop offset="1" stopColor={mark} stopOpacity="0" /></radialGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${gradId})`} />
          </svg>
          {art}
        </motion.div>
      </div>
    </Panel>
  )
}

/** A hero text row with the staggered entrance (index = row position). */
export function HeroItem({ index = 0, as = 'div', className = '', children, ...rest }) {
  const reduced = useReducedMotion()
  const Tag = motion[as] ?? motion.div
  return <Tag className={className} {...heroChildProps(index, reduced)} {...rest}>{children}</Tag>
}
