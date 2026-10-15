import { describe, it, expect } from 'vitest'
import { mapLegacy } from './legacyRedirects'

describe('mapLegacy (DoD-2)', () => {
  const cases = [
    ['/races', '', '/calendar'],
    ['/races', '?season=1988', '/calendar?season=1988'],
    ['/races', '?season=abc', '/calendar'],
    ['/races', '?foo=1', '/calendar'],
    ['/encyclopedia', '', '/drivers'],
    ['/encyclopedia', '?view=constructors&season=2024', '/drivers?view=constructors&season=2024'],
    ['/encyclopedia', '?view=drivers', '/drivers?view=drivers'],
    ['/encyclopedia', '?view=bogus&season=x', '/drivers'],
    ['/encyclopedia', '?view=circuits', '/circuits'],
    ['/encyclopedia', '?view=circuits&season=2020', '/circuits'],
    ['/drivers', '?view=circuits', '/circuits'],
    ['/drivers', '?view=constructors', null],
    ['/drivers', '', null],
    ['/telemetry', '', '/analysis?view=telemetry'],
    ['/telemetry', '?race=2025_9912', '/analysis?view=telemetry&race=2025_9912'],
    ['/telemetry', '?race=bad', '/analysis?view=telemetry'],
    ['/telemetry', '?year=2019', '/analysis?view=telemetry&season=2019'],
    ['/telemetry', '?year=nope', '/analysis?view=telemetry'],
    ['/race-pace', '', '/analysis?view=pace'],
    ['/tire-strategy', '', '/analysis?view=tyres'],
    ['/graph', '', '/teammates?view=network'],
    ['/standings', '', null],
    ['/next-race', '', null],
    ['/races/2025/1', '', null],
    ['/races/', '?season=2020', '/calendar?season=2020'],
  ]
  it.each(cases)('%s%s -> %s', (path, search, expected) => {
    expect(mapLegacy(path, search)).toBe(expected)
  })
})
