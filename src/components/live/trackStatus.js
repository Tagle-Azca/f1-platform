/** Track status codes from the live feed -> visible label + tone class. Always shown as text. */
export const TRACK_STATUS = {
  SafetyCar: { label: 'Safety car',         tone: '' },
  VSC:       { label: 'Virtual safety car', tone: '' },
  SCEnding:  { label: 'Safety car ending',  tone: '' },
  Yellow:    { label: 'Yellow flag',        tone: '' },
  Red:       { label: 'Red flag',           tone: 'tone-red' },
  Chequered: { label: 'Chequered flag',     tone: 'tone-white' },
}
export const isStatusActive = (s) => ['SafetyCar', 'VSC', 'SCEnding', 'Yellow', 'Red'].includes(s)

/** Own-property lookup: feed values such as "__proto__" never resolve to Object.prototype. */
export const trackStatusInfo = (status) => (typeof status === 'string' && Object.hasOwn(TRACK_STATUS, status) ? TRACK_STATUS[status] : null)
