/**
 * LivePill — pulsing red dot + label in a rounded pill.
 * Replaces the repeated "live indicator" inline pattern.
 *
 * Props:
 *   children ReactNode
 */
export default function LivePill({ children }) {
  return (
    <span className="live-pill">
      <span className="live-pill__dot" />
      {children}
    </span>
  )
}
