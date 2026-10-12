import { motion } from 'framer-motion'
import { DUR, useReducedMotion } from '../../styles/motion'

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}

// Pass-2 route enter: the wrapper only fades; sections inside rise (see Rise.jsx).
const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.routeIn } },
  exit:    { opacity: 0, transition: { duration: DUR.routeOut } },
}

/** `className` adds to `.page` (e.g. `page--clip` so sticky descendants work below lg). `stagger` is opt-in. Without it the wrapper keeps the pass-1 200ms fade/rise (out-of-scope pages). */
export default function PageWrapper({ children, stagger = false, className = '' }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className ? `page ${className}` : 'page'}
      variants={stagger ? fadeVariants : variants}
      initial={stagger && reduced ? false : 'initial'}
      animate="animate"
      exit="exit"
      transition={stagger ? undefined : { duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
