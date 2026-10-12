import { memo, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import TeamMark from '../profiles/TeamMark'
import { CARD_LINK, PositionChip, FavouriteChip, Footer } from './cardParts'
import { describeCard } from './encyclopediaModel'
import { riseProps, useReducedMotion } from '../../styles/motion'

/**
 * One team on the hub, the constructor twin of DriverCard: the oversized team code replaces the portrait.
 * The whole card is a single link named by the team name only.
 */
function ConstructorCard({ card, season, layout = 'portrait', favourite = false, index = 0, entrance = false, linkState }) {
  const reduced = useReducedMotion()
  const nameId = useId()
  const descId = useId()
  const motionProps = entrance && !reduced ? riseProps(index + 2, false) : {}

  return (
    <motion.li className="min-w-0" {...motionProps}>
      <Link
        to={`/constructors/${card.id}`} state={linkState} aria-labelledby={nameId} aria-describedby={descId} data-constructor-card={card.id} data-favourite={favourite || undefined}
        className={`${CARD_LINK} ${layout === 'row' ? 'flex min-h-24 gap-pw-3 p-pw-3' : 'flex h-full flex-col p-pw-4'}`}
      >
        <span id={descId} className="sr-only">{describeCard(card, { kind: 'constructor', season, favourite })}</span>
        {layout === 'row' ? (
          <>
            <TeamMark code={card.code} color={card.color} well className="aspect-[11/9] w-[88px] shrink-0 self-start" />
            <div className="flex min-w-0 flex-1 flex-col gap-pw-1">
              <div className="flex items-start justify-between gap-pw-2">
                <span id={nameId} className="line-clamp-2 min-w-0 font-display text-[15px] font-semibold leading-[19px] text-ink [overflow-wrap:anywhere]">{card.name}</span>
                <PositionChip position={card.position} />
              </div>
              <p className="num text-ink-2" aria-hidden="true">{card.points} pts · {card.wins} {card.wins === 1 ? 'win' : 'wins'}</p>
              {favourite && <FavouriteChip className="self-start" />}
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <TeamMark code={card.code} color={card.color} well className="aspect-[5/4] w-full" />
              <PositionChip position={card.position} className="absolute left-pw-2 top-pw-2" />
              {favourite && <FavouriteChip className="absolute right-pw-2 top-pw-2" />}
            </div>
            <span id={nameId} className="mt-pw-3 line-clamp-2 min-h-14 font-display text-lg font-semibold leading-[22px] text-ink [overflow-wrap:anywhere]">{card.name}</span>
            <Footer points={card.points} wins={card.wins} />
          </>
        )}
      </Link>
    </motion.li>
  )
}

export default memo(ConstructorCard)
