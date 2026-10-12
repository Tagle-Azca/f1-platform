/** Feed values are untrusted: anything that is not an array becomes [], and non-object entries are dropped. */
export const asArray = (v) => (Array.isArray(v) ? v : [])
export const asObjectArray = (v) => asArray(v).filter(x => x !== null && typeof x === 'object')
