import { safeText, safeString } from '../../utils/safeText'
import { asObjectArray } from '../../utils/safeArray'

/** Coerce one live classification row to renderable primitives. Objects/arrays in text fields never reach JSX. */
export function normalizeRow(d) {
  return {
    driverNum: safeString(d.driverNum),
    position: safeText(d.position) ?? '',
    acronym: safeString(d.acronym, '—'),
    fullName: safeString(d.fullName),
    teamName: safeString(d.teamName),
    teamColor: typeof d.teamColor === 'string' ? d.teamColor : null,
    stat: safeText(d.stat),
    statLabel: safeText(d.statLabel),
    lastLap: safeText(d.lastLap),
    compound: typeof d.compound === 'string' ? d.compound : null,
    inPit: d.inPit === true,
    retired: d.retired === true,
    sectors: asObjectArray(d.sectors).map(s => ({ value: safeText(s.value) ?? '', status: typeof s.status === 'string' ? s.status : null })),
  }
}
