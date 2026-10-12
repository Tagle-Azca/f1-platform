import CountdownDigits from '../viz/CountdownDigits'

/**
 * CountdownDisplay: the visual is CountdownDigits (unboxed tabular numerals).
 * The ticking digits are aria-hidden; one static sr-only label (changes once per minute, not a live region)
 * carries the meaning.
 *
 * Props:
 *   parts  { d, h, m, s } | null
 *   size?  'sm' | 'lg'   default 'sm'
 *   label? string        prefix for the sr-only text, e.g. "Race starts in"
 */
export default function CountdownDisplay({ parts, size = 'sm', label = 'Starts in' }) {
  if (!parts) return null
  return <CountdownDigits parts={parts} size={size} label={label} />
}
