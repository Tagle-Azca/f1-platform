import { useState, useRef, useCallback, useMemo } from 'react'
import PageWrapper      from '../components/layout/PageWrapper'
import DriverSearch     from '../components/graph/DriverSearch'
import GraphCanvas      from '../components/graph/GraphCanvas'
import EgoSidebar       from '../components/graph/EgoSidebar'
import { useGraphCanvas } from '../hooks/useGraphCanvas'
import { applyRadialLayout } from '../utils/graphLayout'
import { graphApi } from '../services/api'

export default function GraphPage() {
  const [activeDriver, setActiveDriver] = useState(null)
  const [egoData,      setEgoData]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [resetKey,     setResetKey]     = useState(0)

  const fgRef      = useRef()
  const imgCache   = useRef({})

  const { nodeCanvasObject, nodePointerAreaPaint } = useGraphCanvas(imgCache, fgRef)

  const graphData = useMemo(() => {
    if (!egoData?.nodes?.length) return { nodes: [], links: [] }
    return applyRadialLayout(egoData.nodes, egoData.links)
  }, [egoData])

  const loadEgo = useCallback((driverId, name) => {
    setActiveDriver({ driverId, name })
    setLoading(true)
    setError(null)
    setEgoData(null)
    imgCache.current = {}
    graphApi.getDriverEgoGraph(driverId)
      .then(setEgoData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(result) {
    loadEgo(result.id, result.label)
    setResetKey(k => k + 1)
  }

  function handleReset() {
    setActiveDriver(null)
    setEgoData(null)
    setError(null)
    imgCache.current = {}
    setResetKey(k => k + 1)
  }

  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 className="page__title" style={{ marginBottom: 0 }}>Graph Explorer</h1>
        {activeDriver && (
          <button className="btn btn--ghost" style={{ fontSize: '0.78rem' }} onClick={handleReset}>
            Search another driver
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 }}>
          <DriverSearch resetKey={resetKey} onSelect={handleSelect} />
          <GraphCanvas
            graphData={graphData}
            fgRef={fgRef}
            activeDriver={activeDriver}
            loading={loading}
            error={error}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
          />
        </div>

        <EgoSidebar
          activeDriver={activeDriver}
          egoData={egoData}
          loading={loading}
        />
      </div>
    </PageWrapper>
  )
}
