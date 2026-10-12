import { useState } from 'react'
import { motion } from 'framer-motion'
import { safeHttpsUrl } from '../../utils/safeUrl'
import { safeString } from '../../utils/safeText'

/**
 * Cut-out headshot over the car number; falls back to the number alone (team colour).
 * `photoUrl` must be https (validated here, never trusted); a failed image falls back to the number.
 * Sizing is the caller's: `className` for the box, `imgClassName` for the photo. Extracted from the
 * Dashboard TitleFightCard so Standings renders the identical artwork.
 */
export default function DriverPortrait({ photoUrl, number, color, className = '', imgClassName = '', motionProps = {} }) {
  const [broken, setBroken] = useState(false)
  const src = broken ? null : safeHttpsUrl(photoUrl)
  const label = safeString(number)
  return (
    <motion.div className={className} {...motionProps}>
      {label && (
        <svg aria-hidden="true" viewBox="0 0 200 130" className="absolute inset-x-0 top-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
          <text
            x="100" y="118" textAnchor="middle" fontSize="128" fontWeight="800"
            className="font-display" fill={src ? 'none' : color} fillOpacity={src ? 0 : 0.9}
            stroke={color} strokeOpacity={src ? 0.45 : 0} strokeWidth="2"
          >
            {label}
          </text>
        </svg>
      )}
      {src && (
        <img
          src={src} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async"
          width="319" height="319"
          className={imgClassName}
          onError={() => setBroken(true)}
        />
      )}
    </motion.div>
  )
}
