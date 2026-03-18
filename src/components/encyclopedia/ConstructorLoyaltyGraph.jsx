import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { motion, AnimatePresence } from 'framer-motion'
import { graphApi } from '../../services/api'
import { ctorColor } from '../../utils/teamColors'
import EmptyState from '../ui/EmptyState'

const ERAS = [
  { label: 'All',     min: 1950, max: 2099 },
  { label: 'Hybrid',  min: 2014, max: 2099 },
  { label: 'V8',      min: 2006, max: 2013 },
  { label: 'V10',     min: 1995, max: 2005 },
  { label: 'Classic', min: 1950, max: 1994 },
]

const YEAR = new Date().getFullYear()

// Truncate label to fit maxWidth using canvas measureText
function clippedLabel(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1)
  return t + '…'
}

export default function ConstructorLoyaltyGraph({ constructorId }) {
  const [raw,      setRaw]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [era,      setEra]      = useState(ERAS[0])
  const [selected, setSelected] = useState(null)
  const [dims,     setDims]     = useState({ w: 500, h: 420 })
  const containerRef            = useRef()
  const fgRef                   = useRef()
  const fittedRef               = useRef(false)
  const physicsRef              = useRef({ charge: -250, dist: 80 })
  const color                   = ctorColor(constructorId)

  // ── Data fetch ──────────────────────────────────────────────
  useEffect(() => {
    setLoading(true); setRaw(null); setSelected(null)
    graphApi.getConstructorEgoGraph(constructorId)
      .then(setRaw).catch(() => {}).finally(() => setLoading(false))
  }, [constructorId])

  // ── Container resize ────────────────────────────────────────
  // Depends on `loading` so the observer re-attaches after the graph
  // container mounts (on first render the guard returns <EmptyState>
  // so containerRef.current is null until loading finishes).
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setDims({ w, h: Math.max(360, Math.min(500, w * 0.65)) })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [loading])

  // ── Derived data ─────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!raw) return { nodes: [], links: [] }
    const teamNode = raw.nodes.find(n => n.isSelf)
    const drivers  = raw.nodes.filter(n =>
      n.type === 'Driver' &&
      n.seasons?.some(s => parseInt(s) >= era.min && parseInt(s) <= era.max)
    )
    const activeIds = new Set([teamNode?.id, ...drivers.map(n => n.id)])
    return {
      nodes: [teamNode, ...drivers].filter(Boolean),
      links: raw.links.filter(l =>
        activeIds.has(l.source?.id ?? l.source) && activeIds.has(l.target?.id ?? l.target)
      ),
    }
  }, [raw, era])

  // Update physics when node count changes, reset fit flag
  useEffect(() => {
    fittedRef.current = false
    const n = filteredData.nodes.length
    physicsRef.current = {
      charge: -Math.max(220, n * 3.2),
      dist:   Math.max(70, Math.min(160, n * 1.6)),
    }
  }, [filteredData])

  const teammates = useMemo(() => {
    if (!selected || !raw) return []
    const sel = new Set(selected.seasons)
    return raw.nodes
      .filter(n => n.type === 'Driver' && n.id !== selected.id && n.seasons?.some(s => sel.has(s)))
      .sort((a, b) =>
        b.seasons.filter(s => sel.has(s)).length - a.seasons.filter(s => sel.has(s)).length
      )
  }, [selected, raw])

  // ── Canvas rendering ─────────────────────────────────────────
  const nodeCanvasObject = useCallback((node, ctx, scale) => {
    const isTeam   = node.isSelf
    const isActive = !isTeam && (
      node.seasons?.includes(String(YEAR)) || node.seasons?.includes(String(YEAR - 1))
    )
    const isAll = era.label === 'All'

    const r = isTeam
      ? 16
      : isActive
        ? 5 + Math.min((node.seasons?.length || 1) * 0.55, 5)
        : isAll ? 2.5 : 4 + Math.min((node.seasons?.length || 1) * 0.45, 4)

    ctx.shadowBlur  = isTeam ? 28 : isActive ? 14 : 0
    ctx.shadowColor = isTeam || isActive ? color : 'transparent'
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
    ctx.fillStyle = isTeam
      ? color
      : isActive
        ? `${color}dd`
        : isAll ? 'rgba(120,120,120,0.35)' : 'rgba(190,190,190,0.82)'
    ctx.fill()

    if (isActive) {
      ctx.shadowBlur  = 0
      ctx.strokeStyle = `${color}55`
      ctx.lineWidth   = 1.5
      ctx.beginPath()
      ctx.arc(node.x, node.y, r + 3.5, 0, 2 * Math.PI)
      ctx.stroke()
    }
    ctx.shadowBlur = 0

    // Label — only draw above zoom threshold; clip to max pixel width
    const labelThreshold = isTeam ? 0 : isActive ? 0.45 : isAll ? 2.5 : 1.0
    if (scale >= labelThreshold) {
      const fontSize  = isTeam ? 11 : isActive ? 8.5 : 7
      const maxLabelW = isTeam ? 44 : isActive ? 38 : 30
      ctx.font         = `${isTeam ? 800 : isActive ? 700 : 500} ${fontSize}px 'Barlow Condensed', sans-serif`
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle    = isTeam ? '#000' : isActive ? 'rgba(255,255,255,0.95)' : 'rgba(200,200,200,0.65)'
      const rawLabel   = isTeam ? node.name.split(' ')[0].toUpperCase() : node.name.split(' ').pop()
      ctx.fillText(clippedLabel(ctx, rawLabel, maxLabelW), node.x, node.y)
    }
  }, [color, era.label])

  const nodePointerAreaPaint = useCallback((node, col, ctx) => {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.isSelf ? 18 : 11, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  const handleNodeClick = useCallback((node) => {
    if (node.isSelf) { setSelected(null); return }
    setSelected(prev => prev?.id === node.id ? null : node)
    fgRef.current?.centerAt(node.x, node.y, 400)
    fgRef.current?.zoom(2.2, 400)
  }, [])

  const handleEngineStart = useCallback(() => {
    fgRef.current?.d3Force('charge')?.strength(physicsRef.current.charge)
    fgRef.current?.d3Force('link')?.distance(physicsRef.current.dist)
    // Weaker centering force so large graphs can spread out more
    fgRef.current?.d3Force('center')?.strength(0.05)
  }, [])

  const handleEngineStop = useCallback(() => {
    if (!fittedRef.current) {
      fgRef.current?.zoomToFit(500, 20)
      fittedRef.current = true
    }
  }, [])

  // ── Guard ────────────────────────────────────────────────────
  if (loading) return <EmptyState type="loading" height={200} />
  if (!raw?.nodes?.length) return <EmptyState type="empty" message="No graph data available" height={100} />

  const driverCount  = filteredData.nodes.filter(n => n.type === 'Driver').length
  // More warmup ticks for larger graphs so nodes are spread before first paint
  const warmupTicks  = Math.min(300, 80 + driverCount * 2)
  const cooldown     = Math.min(200, 60 + driverCount)

  return (
    <div>
      {/* Header + era buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Loyalty & Driver History</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {driverCount} driver{driverCount !== 1 ? 's' : ''} · {era.label} · click a node to explore
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {ERAS.map(e => (
            <button key={e.label} onClick={() => { setEra(e); setSelected(null) }} style={{
              fontSize: '0.62rem', fontWeight: 700, padding: '3px 9px', borderRadius: 5,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: era.label === e.label ? color : 'rgba(255,255,255,0.06)',
              color:      era.label === e.label ? '#000' : 'var(--text-muted)',
            }}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex' }}>
        {/* Graph */}
        <div
          ref={containerRef}
          style={{ flex: 1, minWidth: 0, borderRadius: 10, overflow: 'hidden', background: 'rgba(4,4,4,0.85)', border: `1px solid ${color}22` }}
        >
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            width={dims.w}
            height={dims.h}
            backgroundColor="rgba(0,0,0,0)"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            linkWidth={link => Math.max(0.7, Math.min(5, (link.target?.seasons?.length || 1) * 0.5))}
            linkColor={link => {
              const active = link.target?.seasons?.includes(String(YEAR)) || link.target?.seasons?.includes(String(YEAR - 1))
              return active ? `${color}55` : 'rgba(255,255,255,0.07)'
            }}
            linkDirectionalParticles={link =>
              (link.target?.seasons?.includes(String(YEAR)) || link.target?.seasons?.includes(String(YEAR - 1))) ? 3 : 0
            }
            linkDirectionalParticleColor={() => color}
            linkDirectionalParticleWidth={2.5}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            onEngineStart={handleEngineStart}
            onEngineStop={handleEngineStop}
            enableZoomInteraction
            enablePanInteraction
            warmupTicks={warmupTicks}
            cooldownTicks={cooldown}
            d3AlphaDecay={0.022}
            d3VelocityDecay={0.4}
          />
        </div>

        {/* Driver panel — absolutely overlaid on top-right of graph */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute', top: 10, right: 10, zIndex: 10,
                width: 170, borderRadius: 10, padding: '0.9rem',
                background: `linear-gradient(160deg, ${color}22, rgba(10,10,10,0.97))`,
                border: `1px solid ${color}50`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-primary)', textTransform: 'uppercase', lineHeight: 1 }}>
                    {selected.name.split(' ').pop()}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    {selected.name.split(' ').slice(0, -1).join(' ')}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>✕</button>
              </div>

              {selected.photoUrl && (
                <img src={selected.photoUrl} alt={selected.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, marginBottom: '0.6rem' }} />
              )}

              <div style={{ background: `${color}18`, borderRadius: 6, padding: '0.45rem 0.6rem', marginBottom: '0.6rem' }}>
                <div style={{ fontSize: '0.55rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>With this team</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {selected.seasons?.length} season{selected.seasons?.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  {selected.seasons?.[0]}{selected.seasons?.length > 1 ? ` – ${selected.seasons[selected.seasons.length - 1]}` : ''}
                </div>
              </div>

              {teammates.length > 0 && (
                <>
                  <div style={{ fontSize: '0.55rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Teammates</div>
                  {teammates.slice(0, 7).map(tm => (
                    <div key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.18rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{tm.name.split(' ').pop()}</span>
                      <span style={{ fontSize: '0.55rem', color: `${color}bb`, fontVariantNumeric: 'tabular-nums' }}>
                        {tm.seasons.filter(s => selected.seasons?.includes(s)).length}y
                      </span>
                    </div>
                  ))}
                  {teammates.length > 7 && (
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>+{teammates.length - 7} more</div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
        {[
          { dot: color,                    label: 'Current / recent driver' },
          { dot: 'rgba(190,190,190,0.8)',  label: 'Historical driver' },
          { line: true,                    label: 'Line thickness = seasons together' },
        ].map(({ dot, line, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {line
              ? <div style={{ width: 18, height: 2, background: color, opacity: 0.4, borderRadius: 1 }} />
              : <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
            }
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
