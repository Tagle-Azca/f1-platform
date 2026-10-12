import { describe, it, expect } from 'vitest'
import { parseNodeId, buildConnections, MAX_CONNECTED } from './connectionsModel'

describe('parseNodeId', () => {
  it('strips the prefix and maps the kind', () => {
    expect(parseNodeId('driver_norris')).toEqual({ kind: 'driver', slug: 'norris' })
    expect(parseNodeId('teammate_piastri')).toEqual({ kind: 'driver', slug: 'piastri' })
    expect(parseNodeId('team_red_bull')).toEqual({ kind: 'team', slug: 'red_bull' })
  })
  it('rejects anything else', () => {
    for (const v of ['', 'norris', 'x_y', 5, null, undefined]) expect(parseNodeId(v)).toBeNull()
  })
})

const payload = {
  nodes: [
    { id: 'driver_norris', name: 'Lando Norris', type: 'Driver', isSelf: true },
    { id: 'team_mclaren', name: 'McLaren', type: 'Team', seasons: ['2022', '2023', '2024', '2025', '2026'] },
    { id: 'teammate_ricciardo', name: 'Daniel Ricciardo', type: 'Teammate', seasons: ['2022'] },
    { id: 'teammate_piastri', name: 'Oscar Piastri', type: 'Teammate', seasons: ['2023', '2024'] },
    { id: 'teammate_<x>', name: 'Odd', type: 'Teammate', seasons: [] },
    { id: 'teammate_piastri', name: 'Dup' },
    { id: 'junk' }, null,
  ],
  links: [
    { source: 'driver_norris', target: 'team_mclaren', rel: 'drove_for' },
    { source: { id: 'teammate_piastri' }, target: 'team_mclaren', rel: 'teammate' },
    { source: 'ghost', target: 'team_mclaren', rel: 'x' },
  ],
}

describe('buildConnections', () => {
  const g = buildConnections(payload, { selfId: 'norris' })
  it('keeps valid nodes and links only', () => {
    expect(g.nodes.map((n) => n.id)).toEqual(['driver_norris', 'team_mclaren', 'teammate_ricciardo', 'teammate_piastri', 'teammate_<x>'])
    expect(g.links).toHaveLength(2)
    expect(g.nodes[0].isSelf).toBe(true)
  })
  it('lists connections by strength then name, with link validity', () => {
    expect(g.connected.map((c) => [c.kind, c.id, c.valid])).toEqual([
      ['team', 'mclaren', true], ['driver', 'piastri', true], ['driver', 'ricciardo', true], ['driver', '<x>', false],
    ])
  })
  it('flags an empty graph (only the centre node)', () => {
    expect(buildConnections({ nodes: [{ id: 'driver_a', isSelf: true }], links: [] }).empty).toBe(true)
    expect(buildConnections(null).empty).toBe(true)
    expect(buildConnections({ nodes: 'x' }).nodes).toEqual([])
  })
  it('caps the connected list', () => {
    const many = { nodes: Array.from({ length: 40 }, (_, i) => ({ id: `teammate_p${i}`, name: `P${i}`, seasons: [] })), links: [] }
    expect(buildConnections(many).connected).toHaveLength(MAX_CONNECTED)
  })
  it('treats a node matching selfId as the centre', () => {
    expect(buildConnections({ nodes: [{ id: 'team_mclaren', name: 'McLaren' }] }, { selfId: 'mclaren' }).empty).toBe(true)
  })
})
