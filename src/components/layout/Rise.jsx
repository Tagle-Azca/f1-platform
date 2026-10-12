import { motion } from 'framer-motion'
import { riseProps, useReducedMotion } from '../../styles/motion'

/**
 * Section wrapper that rises in once per route mount (opt-in; pairs with `PageWrapper stagger`).
 * Never re-animates on data polls: it only animates on mount. Reduced motion renders the final state.
 */
export default function Rise({ index = 0, className = '', children, as = 'div', ...rest }) {
  const reduced = useReducedMotion()
  const Tag = motion[as] ?? motion.div
  return <Tag className={className} {...riseProps(index, reduced)} {...rest}>{children}</Tag>
}
