/** Circuit ids that may be put in a URL path or an API request (the API's own ids are lower-case snake case). */
export const CIRCUIT_ID_RE = /^[a-z0-9_]{1,40}$/
export const isValidCircuitId = (id) => typeof id === 'string' && CIRCUIT_ID_RE.test(id)
