const NAMES = { SOFT: 'Soft', MEDIUM: 'Medium', HARD: 'Hard', INTERMEDIATE: 'Intermediate', WET: 'Wet' }

/** Compound letter in a colored disc. The compound is always also available as text. */
export default function TyreBadge({ compound, size }) {
  if (!compound || compound === 'UNKNOWN') return <span aria-hidden="true" className="inline-block w-5 shrink-0 text-center text-xs text-ink-3">–</span>
  const key = String(compound).toUpperCase()
  return (
    <span className={`tyre tyre--${Object.hasOwn(NAMES, key) ? key : 'X'}${size === 22 ? ' tyre--lg' : ''}`}>
      <span aria-hidden="true">{key[0]}</span>
      <span className="sr-only">{Object.hasOwn(NAMES, key) ? NAMES[key] : 'Unknown'} tyre</span>
    </span>
  )
}
