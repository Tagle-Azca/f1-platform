import { useState, useRef, useMemo, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useGraphCanvas } from '../../hooks/useGraphCanvas'
import { applyRadialLayout, COLOR, LINK_COLOR, seasonRange } from '../../utils/graphLayout'
import { graphApi } from '../../services/api'

export default function DriverNetworkSection({ driverId, driverName }) {
  const [egoData, setEgoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [dims,    setDims]    = useState({ w: 700, h: 420 })

  const fgRef        = useRef()
  const imgCache     = useRef({})
  const containerRef = useRef()

  const { nodeCanvasObject, nodePointerAreaPaint } = useGraphCanvas(imgCache, fgRef)

  useEffect(() => {
    setLoading(true)
    setError(null)
    graphApi.getDriverEgoGraph(driverId)
      .then(setEgoData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [driverId])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) =>
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    )
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const graphData = useMemo(() => {
    if (!egoData?.nodes?.length) return { nodes: [], links: [] }
    return applyRadialLayout(egoData.nodes, egoData.links)
  }, [egoData])

  const teams     = egoData?.nodes?.filter(n => n.type === 'Team')     || []
  const teammates = egoData?.nodes?.filter(n => n.type === 'Teammate') || []

  return (
    <div style={{
      background: 'rgba(22,22,22,0.9)',
      border: '1px solid rgba(255,255,255,0.13)',
      borderTop: '2px solid #ef4444',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.12em', color: '#ef4444', textTransform: 'uppercase',
        }}>
          Career Network
        </span>
        <span className="db-badge db-badge--dgraph">Dgraph</span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ position: 'relative', height: 420, background: '#111' }}
      >
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Building {driverName}'s network...
            </span>
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No graph data available yet — run the Dgraph seed first.
            </span>
          </div>
        )}

        {!loading && !error && graphData.nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No network data for this driver.</span>
          </div>
        )}

        {graphData.nodes.length > 0 && (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={dims.w}
            height={dims.h}
            backgroundColor="#111111"
            nodeLabel={node =>
              node.type === 'Team'
                ? `${node.name} (${seasonRange(node.seasons)})`
                : node.type === 'Teammate'
                  ? `${node.name} · ${seasonRange(node.seasons)}`
                  : node.name
            }
            linkColor={link => LINK_COLOR[link.rel] || 'rgba(255,255,255,0.08)'}
            linkWidth={link => link.rel === 'drove_for' ? 2 : 1}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            onEngineStop={() => fgRef.current?.zoomToFit(300, 60)}
            enableZoomInteraction
            enablePanInteraction
          />
        )}
      </div>

      {/* Legend + stats */}
      {graphData.nodes.length > 0 && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          {[
            { color: COLOR.Driver,   label: 'Driver' },
            { color: COLOR.Team,     label: 'Team', line: true },
            { color: COLOR.Teammate, label: 'Teammate' },
          ].map(({ color, label, line }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {line
                ? <div style={{ width: 18, height: 2, background: color, borderRadius: 2 }} />
                : <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              }
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {teams.length} teams · {teammates.length} teammates
          </span>
        </div>
      )}
    </div>
  )
}
