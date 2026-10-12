// The only file that imports react-force-graph-2d on the profile pages. It is loaded with React.lazy after the
// "Show network" tap, so the chunk is never part of the initial load or of scrolling past the section.
import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { readVizColors } from '../../styles/chartTheme'
import { teamMark, ctorColor, CTOR_COLORS, BASE } from '../../styles/vizPalette'
import { cn } from '@/lib/utils'

const FONT = '12px Barlow, sans-serif'

function roundedSquare(ctx, x, y, r, radius) {
  ctx.beginPath()
  ctx.roundRect(x - r, y - r, r * 2, r * 2, radius)
}

/**
 * Force graph restyled from the --viz-* tokens read once at mount (no hex literals): links in the baseline tone, driver
 * nodes as circles, team nodes as rounded squares in the team mark colour (shape is the non-colour backup), the centre
 * node ringed in steel. Labels are drawn only for the centre, hovered and selected nodes.
 * The simulation settles for at most 3s and then freezes; with reduced motion it is solved off-screen first.
 * Gestures: never on a coarse pointer until `exploring`; wheel zoom on a fine pointer only after a click.
 */
export default function ConnectionsCanvas({ graph, exploring, reduced, coarse }) {
  const wrap = useRef(null)
  const fg = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState(null)
  const [picked, setPicked] = useState(null)
  const [clicked, setClicked] = useState(false)
  const colors = useMemo(() => readVizColors(), [])
  const data = useMemo(() => ({ nodes: graph.nodes.map((n) => ({ ...n })), links: graph.links.map((l) => ({ ...l })) }), [graph])

  useEffect(() => {
    const el = wrap.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setSize((s) => (s.w === Math.round(width) && s.h === Math.round(height) ? s : { w: Math.round(width), h: Math.round(height) }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const gestures = coarse ? exploring : true
  const zoom = coarse ? exploring : exploring || clicked

  function paint(node, ctx, scale) {
    const r = node.isSelf ? 8 : 5
    const fill = node.kind === 'team'
      ? teamMark(ctorColor(Object.hasOwn(CTOR_COLORS, node.slug) ? node.slug : ''), BASE.panel)
      : node.isSelf ? colors.steel : colors.ink2
    ctx.fillStyle = fill
    if (node.kind === 'team') roundedSquare(ctx, node.x, node.y, r, 2)
    else { ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2) }
    ctx.fill()
    if (node.isSelf) {
      ctx.lineWidth = 2
      ctx.strokeStyle = colors.steel
      ctx.beginPath(); ctx.arc(node.x, node.y, r + 3, 0, Math.PI * 2); ctx.stroke()
    }
    if (node.isSelf || node.id === hover || node.id === picked) {
      ctx.font = FONT
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = colors.ink
      ctx.fillText(node.name, node.x, node.y + r + 5 / Math.max(1, scale))
    }
  }

  function area(node, color, ctx) {
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(node.x, node.y, 12, 0, Math.PI * 2); ctx.fill()
  }

  return (
    <div
      ref={wrap}
      data-connections-canvas
      onPointerDown={() => setClicked(true)}
      onPointerLeave={() => setClicked(false)}
      className={cn('absolute inset-0 touch-pan-y [&_canvas]:!touch-pan-y', exploring && 'touch-none [&_canvas]:!touch-none')}
    >
      {size.w > 0 && size.h > 0 && (
        <ForceGraph2D
          ref={fg}
          graphData={data}
          width={size.w}
          height={size.h}
          backgroundColor={colors.panel}
          nodeLabel={() => ''}
          nodeCanvasObject={paint}
          nodePointerAreaPaint={area}
          linkColor={() => colors.baseline}
          linkWidth={1}
          linkDirectionalParticles={0}
          onNodeHover={(n) => setHover(n ? n.id : null)}
          onNodeClick={(n) => setPicked(n.id)}
          onBackgroundClick={() => setPicked(null)}
          warmupTicks={reduced ? 120 : 0}
          cooldownTicks={reduced ? 0 : Infinity}
          cooldownTime={3000}
          onEngineStop={() => fg.current?.zoomToFit(reduced ? 0 : 300, 40)}
          enableZoomInteraction={zoom}
          enablePanInteraction={gestures}
          enableNodeDrag={gestures}
        />
      )}
    </div>
  )
}
