import { useState, useEffect, useRef } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { COLOR, LINK_COLOR, seasonRange } from '../../utils/graphLayout'

export default function GraphCanvas({
  graphData,
  fgRef,
  activeDriver,
  loading,
  error,
  nodeCanvasObject,
  nodePointerAreaPaint,
}) {
  const containerRef = useRef()
  const [dims, setDims] = useState({ w: 800, h: 560 })

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) =>
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    )
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className="card card--dgraph"
        style={{ padding: 0, overflow: 'hidden', height: 520, position: 'relative' }}
      >
        {!activeDriver && !loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', maxWidth: 280 }}>
              Search for a driver above to see their connection network — teams, teammates and their full F1 career
            </p>
          </div>
        )}

        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(13,13,13,0.8)', zIndex: 10,
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Building {activeDriver?.name}'s network...
            </p>
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--f1-red)' }}>Error: {error}</p>
          </div>
        )}

        {graphData.nodes.length > 0 && (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={dims.w}
            height={dims.h}
            backgroundColor="#131313"
            nodeLabel={node =>
              node.type === 'Team'
                ? `${node.name} (${seasonRange(node.seasons)})`
                : node.type === 'Teammate'
                  ? `${node.name} · ${seasonRange(node.seasons)}`
                  : node.name
            }
            linkColor={link => LINK_COLOR[link.rel] || 'rgba(255,255,255,0.08)'}
            linkWidth={link => link.rel === 'drove_for' ? 2 : 1}
            linkDirectionalParticles={0}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
            onEngineStop={() => fgRef.current?.zoomToFit(300, 50)}
            enableZoomInteraction
            enablePanInteraction
          />
        )}
      </div>

      {graphData.nodes.length > 0 && (
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', padding: '0 0.25rem' }}>
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
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {graphData.nodes.filter(n => n.type === 'Team').length} teams ·{' '}
            {graphData.nodes.filter(n => n.type === 'Teammate').length} teammates
          </span>
        </div>
      )}
    </>
  )
}
