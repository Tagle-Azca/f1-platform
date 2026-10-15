import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import VizSkeleton from '../components/viz/VizSkeleton'
import { useDriverConnections } from '../hooks/useDriverConnections'
import MatchupHero from '../components/teammates/MatchupHero'
import StatCompare from '../components/teammates/StatCompare'
import SameGarage from '../components/teammates/SameGarage'
import DriverOverview from '../components/teammates/DriverOverview'
import MatchupPresets, { DriverChips } from '../components/teammates/MatchupPresets'
import { SharedTeams, CommonTeammates } from '../components/teammates/MatchupLists'
import { PRESET_NAMES } from '../components/teammates/constants'
import {
  DATA_RANGE, FOOTNOTE, parseMatchup, matchupParams, resolveDriverName, hasNoData, matchupRelation,
  slotColor, sharedTeams, commonTeammates, compareRows, comparisonSentence, surname,
} from '../components/teammates/teammatesModel'
import { riseProps, useReducedMotion } from '../styles/motion'

function slotStatus(id, conn) {
  if (!id) return 'empty'
  if (conn.status === 'error') return 'error'
  if (conn.status !== 'ready') return 'loading'
  return hasNoData(conn.data) ? 'nodata' : 'ready'
}

export default function TeammateHistoryPage() {
  const reduced = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const { a, b, fix } = parseMatchup(params)
  const [labels, setLabels] = useState({}) // search-hit names by id (display only; the selection lives in the URL)
  const [focusSlot, setFocusSlot] = useState(null)

  // A malformed or duplicate id is corrected in place (replace), never pushed
  useEffect(() => { if (fix) setParams(matchupParams(a, b), { replace: true }) }, [fix, a, b, setParams])

  const connA = useDriverConnections(a)
  const connB = useDriverConnections(b)
  const nameA = a ? resolveDriverName(a, { preset: PRESET_NAMES[a], partnerData: connB.data, searchHit: labels[a] }) : ''
  const nameB = b ? resolveDriverName(b, { preset: PRESET_NAMES[b], partnerData: connA.data, searchHit: labels[b] }) : ''
  const slots = [
    { id: a, name: nameA, status: slotStatus(a, connA), data: connA.data, retry: connA.retry },
    { id: b, name: nameB, status: slotStatus(b, connB), data: connB.data, retry: connB.retry },
  ]
  const [sa, sb] = slots

  const select = (na, nb) => setParams(matchupParams(na, nb)) // every user selection is a push, so Back steps through choices

  function onPick(slot, info) {
    if (info.name) setLabels((l) => ({ ...l, [info.driverId]: info.name }))
    setFocusSlot(null)
    if (slot === 'a') select(info.driverId, b)
    else select(a, info.driverId)
  }
  function onRemove(slot) {
    setFocusSlot(slot === 'a' && b ? 'b' : slot) // focus the combobox that appears
    if (slot === 'a') select(b, '')
    else select(a, '')
  }
  const onSwap = () => select(b, a)
  // A chip always fills the first driver, then focuses the second slot (when it is still empty)
  const onChip = (d) => {
    if (d.name) setLabels((l) => ({ ...l, [d.driverId]: d.name }))
    const nb = d.driverId === b ? a : b
    setFocusSlot(nb ? null : 'b')
    select(d.driverId, nb)
  }

  const both = sa.status === 'ready' && sb.status === 'ready'
  const rows = useMemo(() => (both ? compareRows(connA.data.stats, connB.data.stats) : []), [both, connA.data, connB.data])
  const relation = both ? matchupRelation(connA.data, connB.data, b) : null
  const sentence = both ? comparisonSentence({ nameA, nameB, relation, rows }) : ''
  const fullNameA = both && relation.kind === 'teammates'
    ? (connB.data.teammates.find((t) => t.driverId === a)?.name ?? null)
    : null
  const rise = (i) => (reduced ? { initial: false } : riseProps(i, false))

  const loadingBody = slots.some((s) => s.status === 'loading')
  const nothing = !a && !b

  return (
    <PageWrapper stagger>
      <PageHeader title="Rivalries" subtitle={`Compare any two drivers. Pitwall data covers ${DATA_RANGE}.`} />

      <div className="flex flex-col gap-pw-6">
        <MatchupHero slots={slots} onPick={onPick} onRemove={onRemove} onSwap={onSwap} focusSlot={focusSlot} />

        <div role="status" className="sr-only">{sentence}</div>

        {nothing && (
          <>
            <EmptyState type="empty" message="Pick two drivers to compare" height={80} />
            <DriverChips onPick={onChip} />
            <MatchupPresets />
          </>
        )}

        {!nothing && (
          <motion.div className="flex min-w-0 flex-col gap-pw-6" aria-busy={loadingBody || undefined} {...rise(1)}>
            {both && (
              <>
                <p className="flex flex-wrap items-center gap-pw-2">
                  <span className="inline-flex min-h-6 items-center rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2">{relation.text}</span>
                </p>
                <div className="grid min-w-0 gap-pw-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="flex min-w-0 flex-col gap-pw-6">
                    <StatCompare rows={rows} nameA={nameA} nameB={nameB} colorA={slotColor(connA.data)} colorB={slotColor(connB.data)} />
                    {relation.kind === 'teammates' && (
                      <SameGarage key={`${a}|${b}`} fullNameA={fullNameA} nameB={nameB} seasons={relation.seasons} color={slotColor(connA.data)} />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-pw-6">
                    <SharedTeams teams={sharedTeams(connA.data, connB.data)} nameA={nameA} nameB={nameB} />
                    <CommonTeammates people={commonTeammates(connA.data, connB.data, a, b)} />
                  </div>
                </div>
                <p className="text-xs text-ink-3">{FOOTNOTE}</p>
              </>
            )}

            {!both && (
              <>
                {slots.map((s) => s.status === 'ready' && (
                  <DriverOverview key={s.id} id={s.id} name={s.name} data={s.data} withTeammates={!b} />
                ))}
                {loadingBody && <VizSkeleton variant="rows" name="driver career" count={4} />}
                {b && sa.status !== 'loading' && sb.status !== 'loading' && (
                  <p className="text-sm text-ink-2">{surname(sa.name)} and {surname(sb.name)} can&apos;t be compared until both have race data.</p>
                )}
                <p className="text-xs text-ink-3">{FOOTNOTE}</p>
              </>
            )}

            <MatchupPresets heading={both ? 'Try another matchup' : 'Popular matchups'} exclude={[a, b]} />
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
