/** Keeps only [lon, lat] pairs of finite numbers (feed data is untrusted). */
export function cleanCoords(coords) {
  if (!Array.isArray(coords)) return []
  return coords.filter((c) => Array.isArray(c) && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])).map((c) => [c[0], c[1]])
}
