/**
 * LivePill — dot + text label in a rounded pill. State is always conveyed by
 * text (default "Live"), never by color alone. Text is --pw-ink on a red tint.
 */
export default function LivePill({ children = 'Live' }) {
  return (
    <span className="live-pill">
      <span className="live-pill__dot" aria-hidden="true" />
      {children}
    </span>
  )
}
