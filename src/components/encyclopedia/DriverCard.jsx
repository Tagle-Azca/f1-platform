import { memo, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DriverPortrait from '../viz/DriverPortrait'
import { TeamStripe } from '../profiles/ProfileLinks'
import { CARD_LINK, WELL_CLASS, PositionChip, FavouriteChip, Footer } from './cardParts'
import { describeCard } from './encyclopediaModel'
import { teamMark, BASE } from '../../styles/vizPalette'
import { riseProps, useReducedMotion } from '../../styles/motion'

const IMG = 'relative h-full w-auto max-w-full object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_75%,transparent)]'

function Art({ card, className }) {
  const mark = teamMark(card.color, BASE.bg)
  // Number fallback chain: car number, then code, then initials (never a silhouette)
  const art = card.number || card.code || card.surname.slice(0, 2).toUpperCase()
  return (
    <div className={`${WELL_CLASS} ${className}`}>
      <DriverPortrait photoUrl={card.photoUrl} number={art} color={mark} className="absolute inset-0 flex items-end justify-center" imgClassName={IMG} />
      <svg aria-hidden="true" focusable="false" className="absolute inset-x-0 bottom-0 block h-[3px] w-full"><rect width="100%" height="3" fill={mark} /></svg>
    </div>
  )
}

/**
 * One driver on the hub: the whole card is a single link named by the driver's name only; position, points, wins,
 * team and the favourite flag are its description. `layout="row"` below 640px, `"portrait"` from 640px.
 */
function DriverCard({ card, season, layout = 'portrait', favourite = false, index = 0, entrance = false, linkState }) {
  const reduced = useReducedMotion()
  const nameId = useId()
  const descId = useId()
  const motionProps = entrance && !reduced ? riseProps(index + 2, false) : {}
  const mark = teamMark(card.color, BASE.panel)
  const stripe = card.team ? <TeamStripe color={mark} /> : null

  return (
    <motion.li className="min-w-0" {...motionProps}>
      <Link
        to={`/drivers/${card.id}`} state={linkState} aria-labelledby={nameId} aria-describedby={descId} data-driver-card={card.id} data-favourite={favourite || undefined}
        className={`${CARD_LINK} ${layout === 'row' ? 'flex min-h-24 gap-pw-3 p-pw-3' : 'flex h-full flex-col p-pw-4'}`}
      >
        <span id={descId} className="sr-only">{describeCard(card, { kind: 'driver', season, favourite })}</span>
        {layout === 'row' ? (
          <>
            <Art card={card} className="aspect-[11/9] w-[88px] shrink-0 self-start" />
            <div className="flex min-w-0 flex-1 flex-col gap-pw-1">
              <div className="flex items-start justify-between gap-pw-2">
                <span id={nameId} className="line-clamp-2 min-w-0 font-display text-[15px] font-semibold leading-[19px] text-ink [overflow-wrap:anywhere]">{card.name}</span>
                <PositionChip position={card.position} />
              </div>
              {card.team && <p className="flex min-w-0 items-center gap-pw-2 text-[13px] text-ink-2">{stripe}<span className="truncate">{card.team}</span></p>}
              <p className="num text-ink-2" aria-hidden="true">{card.points} pts · {card.wins} {card.wins === 1 ? 'win' : 'wins'}</p>
              {favourite && <FavouriteChip className="self-start" />}
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <Art card={card} className="aspect-[5/4] w-full" />
              <PositionChip position={card.position} className="absolute left-pw-2 top-pw-2" />
              {favourite && <FavouriteChip className="absolute right-pw-2 top-pw-2" />}
            </div>
            <span id={nameId} className="sr-only">{card.name}</span>
            <div className="mt-pw-3 min-h-14" aria-hidden="true">
              {card.given && <span className="block truncate text-xs text-ink-2">{card.given}</span>}
              <span className="block truncate font-display text-lg font-semibold leading-[22px] text-ink">{card.surname}</span>
              {card.team && <span className="mt-pw-1 flex min-w-0 items-center gap-pw-2 text-sm text-ink-2">{stripe}<span className="truncate">{card.team}</span></span>}
            </div>
            <Footer points={card.points} wins={card.wins} />
          </>
        )}
      </Link>
    </motion.li>
  )
}

export default memo(DriverCard)
