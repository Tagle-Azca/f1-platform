export const COLOR = {
  Driver:   '#e10600',
  Team:     '#f59e0b',
  Teammate: '#94a3b8',
}

export const LINK_COLOR = {
  drove_for: 'rgba(245,158,11,0.5)',
  teammate:  'rgba(148,163,184,0.18)',
}

export function seasonRange(seasons) {
  if (!seasons?.length) return ''
  const s = [...seasons].sort()
  return s.length === 1 ? s[0] : `${s[0]}–${s[s.length - 1]}`
}

// Layout for constructor graph: center node surrounded by drivers in a full circle
export function applyCircularLayout(rawNodes, rawLinks) {
  const nodes = rawNodes.map(n => ({ ...n }))
  const links = rawLinks.map(l => ({ ...l }))

  const center   = nodes.find(n => n.isSelf)
  const spokes   = nodes.filter(n => !n.isSelf)

  if (center) { center.fx = 0; center.fy = 0 }

  const radius = Math.max(160, spokes.length * 14)
  spokes.forEach((n, i) => {
    const a = (2 * Math.PI * i) / spokes.length - Math.PI / 2
    n.fx = Math.cos(a) * radius
    n.fy = Math.sin(a) * radius
  })

  return { nodes, links }
}

export function applyRadialLayout(rawNodes, rawLinks) {
  const nodes = rawNodes.map(n => ({ ...n }))
  const links = rawLinks.map(l => ({ ...l }))

  const center    = nodes.find(n => n.isSelf)
  const teams     = nodes.filter(n => n.type === 'Team')
  const teammates = nodes.filter(n => n.type === 'Teammate')

  if (center) { center.fx = 0; center.fy = 0 }

  const teamAngleMap = {}
  teams.forEach((t, i) => {
    const a = (2 * Math.PI * i) / teams.length - Math.PI / 2
    t.fx = Math.cos(a) * 140
    t.fy = Math.sin(a) * 140
    teamAngleMap[t.id.replace('team_', '')] = a
  })

  const tmGroups = {}
  for (const tm of teammates) {
    const primary = tm.teamIds?.[0]
    if (!tmGroups[primary]) tmGroups[primary] = []
    tmGroups[primary].push(tm)
  }

  const positioned = new Set()
  for (const [ctorId, group] of Object.entries(tmGroups)) {
    const baseAngle = teamAngleMap[ctorId] ?? 0
    const arcSpread = Math.min(0.75, group.length * 0.2 + 0.1)
    group.forEach((tm, j) => {
      if (positioned.has(tm.id)) return
      const offset = group.length > 1
        ? (j / (group.length - 1) - 0.5) * arcSpread
        : 0
      tm.fx = Math.cos(baseAngle + offset) * 270
      tm.fy = Math.sin(baseAngle + offset) * 270
      positioned.add(tm.id)
    })
  }

  const unpos = teammates.filter(t => !positioned.has(t.id))
  unpos.forEach((t, i) => {
    const a = (2 * Math.PI * i) / Math.max(unpos.length, 1)
    t.fx = Math.cos(a) * 270
    t.fy = Math.sin(a) * 270
  })

  return { nodes, links }
}
