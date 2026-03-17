import { useRef, useState, useEffect, useMemo } from 'react'
import GraphCanvas  from '../graph/GraphCanvas'
import EgoSidebar  from '../graph/EgoSidebar'
import { useGraphCanvas } from '../../hooks/useGraphCanvas'
import { applyRadialLayout } from '../../utils/graphLayout'
import { graphApi } from '../../services/api'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export default function DriverGraph({ driverId, driverName, onSelect }) {
  const { isMobile } = useBreakpoint()
  const fgRef      = useRef()
  const imgCache   = useRef({})
  const [egoData,  setEgoData]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const { nodeCanvasObject, nodePointerAreaPaint } = useGraphCanvas(imgCache, fgRef)

  useEffect(() => {
    if (!driverId) return
    setLoading(true)
    setEgoData(null)
    setError(null)
    imgCache.current = {}
    graphApi.getDriverEgoGraph(driverId)
      .then(setEgoData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [driverId])

  const graphData = useMemo(() => {
    if (!egoData?.nodes?.length) return { nodes: [], links: [] }
    return applyRadialLayout(egoData.nodes, egoData.links)
  }, [egoData])

  const activeDriver = driverId ? { driverId, name: driverName } : null

  function handleNodeClick(node) {
    if (!onSelect || node.isSelf) return
    if (node.type === 'Teammate') {
      const id = node.id.replace('teammate_', '')
      onSelect({ type: 'driver', id, label: node.name })
    } else if (node.type === 'Team') {
      const id = node.id.replace('team_', '')
      onSelect({ type: 'constructor', id, label: node.name })
    }
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--dgraph-color)',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 13, height: 13 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 0 1 0-5.303m5.304-.001a3.75 3.75 0 0 1 0 5.304m-7.425 2.122a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.394c-3.897-3.897-3.897-10.22 0-14.117m13.788 0c3.897 3.897 3.897 10.22 0 14.117M12 12h.008v.008H12V12Z" />
          </svg>
          Connection Network · Dgraph
        </span>
        <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem',
        alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0, width: '100%' }}>
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

        <EgoSidebar
          activeDriver={activeDriver}
          egoData={egoData}
          loading={loading}
          isMobile={isMobile}
        />
      </div>
    </div>
  )
}
