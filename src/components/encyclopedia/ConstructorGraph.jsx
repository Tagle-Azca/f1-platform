import { useRef, useState, useEffect, useMemo } from 'react'
import GraphCanvas from '../graph/GraphCanvas'
import { useGraphCanvas } from '../../hooks/useGraphCanvas'
import { applyCircularLayout } from '../../utils/graphLayout'
import { graphApi } from '../../services/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function ConstructorGraph({ constructorId, constructorName, onSelect }) {
  const { isMobile } = useBreakpoint()
  const fgRef    = useRef()
  const imgCache = useRef({})
  const [egoData, setEgoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const { nodeCanvasObject, nodePointerAreaPaint } = useGraphCanvas(imgCache, fgRef)

  useEffect(() => {
    if (!constructorId) return
    setLoading(true)
    setEgoData(null)
    setError(null)
    imgCache.current = {}
    graphApi.getConstructorEgoGraph(constructorId)
      .then(setEgoData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [constructorId])

  const graphData = useMemo(() => {
    if (!egoData?.nodes?.length) return { nodes: [], links: [] }
    return applyCircularLayout(egoData.nodes, egoData.links)
  }, [egoData])

  const activeDriver = constructorId
    ? { driverId: constructorId, name: constructorName }
    : null

  function handleNodeClick(node) {
    if (!onSelect || node.isSelf) return
    if (node.type === 'Driver') {
      const id = node.id.replace('driver_', '')
      onSelect({ type: 'driver', id, label: node.name })
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--dgraph-color)',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 13, height: 13 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 0 1 0-5.303m5.304-.001a3.75 3.75 0 0 1 0 5.304m-7.425 2.122a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.394c-3.897-3.897-3.897-10.22 0-14.117m13.788 0c3.897 3.897 3.897 10.22 0 14.117M12 12h.008v.008H12V12Z" />
          </svg>
          Driver Network · Dgraph
        </span>
        {egoData?.total > 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {egoData.total} drivers across all seasons
          </span>
        )}
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <GraphCanvas
        graphData={graphData}
        fgRef={fgRef}
        activeDriver={activeDriver}
        loading={loading}
        error={error}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        onNodeClick={handleNodeClick}
        isMobile={isMobile}
      />
    </div>
  )
}
