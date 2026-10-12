// Motion foundation (pass 2). Mirrors the CSS vars in src/index.css (--ease-*, --dur-*).
// framer-motion is the only animation engine for JS-driven motion; CSS handles hover/press/flash.
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

export const EASE_OUT = [0.16, 1, 0.3, 1]
export const EASE_INOUT = [0.65, 0, 0.35, 1]

/** Seconds (framer-motion units). */
export const DUR = { press: 0.1, fast: 0.15, base: 0.24, enter: 0.48, bars: 0.6, draw: 0.9, flash: 0.7, routeIn: 0.16, routeOut: 0.12 }

export const MAX_STAGGER = 6
export const SECTION_STEP = 0.07

/** Delay for the i-th staggered child; children after the 6th reuse the 6th delay so total time stays bounded. */
export function staggerDelay(index, step = SECTION_STEP, max = MAX_STAGGER) {
  const i = Number.isFinite(index) && index > 0 ? Math.floor(index) : 0
  return Math.min(i, max - 1) * step
}

/** Wrapper around framer's hook that always returns a boolean. */
export function useReducedMotion() {
  return useFramerReducedMotion() === true
}

/** Section rise: y 12 -> 0 with opacity, once per mount. Returns motion props; reduced motion renders the final state. */
export function riseProps(index, reduced) {
  if (reduced) return { initial: false }
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.enter, ease: EASE_OUT, delay: staggerDelay(index) },
  }
}

/** Smaller internal rise for hero children: y 8 -> 0, 400ms, 60ms step, delayed 100ms after the section's own step. */
export function heroChildProps(index, reduced, base = 0) {
  if (reduced) return { initial: false }
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE_OUT, delay: base + 0.1 + staggerDelay(index, 0.06) },
  }
}

/** Bar fill: scaleX 0 -> 1 from the left. Use with style-free `transform-box: fill-box` via the .viz-grow class. */
export function growProps(index, reduced, step = 0.08) {
  if (reduced) return { initial: false }
  return {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { duration: DUR.bars, ease: EASE_OUT, delay: staggerDelay(index, step) },
  }
}
