import { teamMark } from '../../styles/vizPalette'

/** Team color stub (data mark). Always sits next to a driver code or name; decorative. */
export default function TeamBar({ color, width = 4, height = 24, className = '' }) {
  return (
    <svg aria-hidden="true" focusable="false" width={width} height={height} className={`shrink-0 ${className}`}>
      <rect width={width} height={height} rx="2" fill={teamMark(color)} />
    </svg>
  )
}
