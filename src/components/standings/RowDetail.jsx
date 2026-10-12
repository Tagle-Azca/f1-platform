import Sparkline from '../viz/Sparkline'
import HeadToHeadBar from '../viz/HeadToHeadBar'
import { buttonVariants } from '../ui/button-variants'
import { teamMark, BASE } from '../../styles/vizPalette'
import { safeString } from '../../utils/safeText'
import { cn } from '@/lib/utils'

const Label = ({ children }) => <dt className="text-xs text-ink-3">{children}</dt>

/** Mirrored points bar (as the Dashboard head to head): this driver grows left, the teammate right. */
function HeadToHead({ row, mate }) {
  const diff = mate.diff > 0 ? `${mate.diff} points ahead` : mate.diff < 0 ? `${-mate.diff} behind` : 'Level'
  return (
    <div className="col-span-2">
      <dt className="text-xs text-ink-3">Against {mate.surname}</dt>
      <dd className="m-0">
        <HeadToHeadBar
          left={{ code: row.code, value: row.pts }} right={{ code: mate.code, value: mate.pts }}
          color={teamMark(row.color, BASE.raise)} max={Math.max(1, row.pts, mate.pts)} caption={diff}
        />
      </dd>
    </div>
  )
}

/**
 * The inline strip under an open row. Numbers follow the replay round; nothing animates in here.
 * `detail` comes from standingsModel.rowDetail(series, id, round).
 */
export default function RowDetail({ id, labelledBy, row, detail, round, rounds, onOpenProfile, onKeyDown }) {
  const color = teamMark(row.color, BASE.raise)
  const best = detail.bestRound
  const bestRace = best ? safeString(rounds[best.round - 1]?.raceName) : ''
  const sentence = best
    ? `${row.name} points per round. Best round: ${best.pts} points in round ${best.round}. Last ${detail.last5.length} rounds: ${detail.last5.join(', ')}, total ${detail.last5Sum}.`
    : `${row.name} has no points yet.`
  return (
    <div className="st-expand">
      <div className="min-h-0 overflow-hidden px-pw-3 pb-pw-3">
        <section
          id={id} role="region" aria-labelledby={labelledBy} onKeyDown={onKeyDown}
          className="rounded-md border border-edge bg-raise p-pw-4"
        >
          <div className="grid gap-pw-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-x-pw-6">
            <div className="min-w-0">
              <p className="mb-pw-2 text-xs text-ink-3">Points per round</p>
              <Sparkline values={detail.perRound} mark={round} color={color} />
              <p className="sr-only">{sentence}</p>
              {detail.penalty && <p className="mt-pw-2 text-xs text-ink-3">Penalties are not shown.</p>}
            </div>
            <dl className="m-0 grid min-w-0 grid-cols-2 gap-x-pw-4 gap-y-pw-3">
              <div>
                <Label>Wins this season</Label>
                <dd className="m-0 text-stat text-ink">{row.wins}</dd>
              </div>
              <div className="min-w-0">
                <Label>Best round</Label>
                <dd className="m-0">
                  <span className="num text-ink">{best ? `${best.pts} pts` : 'None yet'}</span>
                  {best && bestRace && <span className="block truncate text-sm text-ink-2">{`R${best.round}, ${bestRace}`}</span>}
                </dd>
              </div>
              <div className="col-span-2">
                <Label>Last {detail.last5.length === 5 ? '5 rounds' : detail.last5.length === 1 ? 'round' : `${detail.last5.length} rounds`}</Label>
                <dd className="m-0 flex flex-wrap items-center gap-x-pw-2">
                  {detail.last5.map((v, i) => <span key={i} className="num min-w-9 text-sm text-ink-2">{v}</span>)}
                  <span className="num text-ink-3">=</span>
                  <span className="num font-medium text-ink">{detail.last5Sum}</span>
                </dd>
              </div>
              {detail.teammate && <HeadToHead row={row} mate={{ ...detail.teammate, surname: detail.teammate.surname }} />}
              {row.kind === 'constructor' && (
                <div className="col-span-2">
                  <Label>Gap to the team ahead</Label>
                  <dd className="m-0">
                    {detail.ahead
                      ? <><span className="num text-ink">{detail.ahead.gap} pts</span> <span className="text-sm text-ink-2">behind {detail.ahead.name}</span></>
                      : <span className="text-sm text-ink">Leader</span>}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <div className="mt-pw-4 flex lg:justify-end">
            <button type="button" onClick={onOpenProfile} className={cn(buttonVariants({ variant: 'outline' }), 'min-h-11 w-full lg:w-auto')}>
              Open profile
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
