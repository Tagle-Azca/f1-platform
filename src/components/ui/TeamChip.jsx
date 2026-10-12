import { tint, lift } from '../../utils/teamColors'

/** Rounded-square chip carrying a driver/constructor's 3-letter code, tinted to team color. */
export default function TeamChip({ code, color, size = 34 }) {
  if (!color) color = '#888'
  return (
    <span style={{
      width: size, height: size, borderRadius: size >= 34 ? 10 : 9, flexShrink: 0,
      display: 'grid', placeItems: 'center',
      background: tint(color, 0.16), color: lift(color),
      fontSize: size >= 34 ? 11 : 10.5, fontWeight: 700, letterSpacing: '.02em',
    }}>
      {code}
    </span>
  )
}
