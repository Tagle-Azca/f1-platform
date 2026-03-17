import { useState, useRef, useCallback, useMemo } from 'react'
import PageWrapper      from '../components/layout/PageWrapper'
import DriverSearch     from '../components/graph/DriverSearch'
import GraphCanvas      from '../components/graph/GraphCanvas'
import EgoSidebar       from '../components/graph/EgoSidebar'
import { useGraphCanvas } from '../hooks/useGraphCanvas'
import { applyRadialLayout } from '../utils/graphLayout'
import { graphApi } from '../services/api'
import PageHint from '../components/ui/PageHint'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function GraphPage() {
  const { isMobile } = useBreakpoint()
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
      <PageHint
        id="graph"
        title="Graph Explorer"
        text="Search for a driver to explore their network of teams and teammates. Drag nodes to rearrange the graph."
        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 0 1 0-5.303m5.304-.001a3.75 3.75 0 0 1 0 5.304m-7.425 2.122a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.394c-3.897-3.897-3.897-10.22 0-14.117m13.788 0c3.897 3.897 3.897 10.22 0 14.117M12 12h.008v.008H12V12Z" /></svg>}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 className="page__title" style={{ marginBottom: 0 }}>Graph Explorer</h1>
        {activeDriver && (
          <button className="btn btn--ghost" style={{ fontSize: '0.78rem' }} onClick={handleReset}>
            Search another driver
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0, width: '100%' }}>
          <DriverSearch resetKey={resetKey} onSelect={handleSelect} />
          <GraphCanvas
            graphData={graphData}
            fgRef={fgRef}
            activeDriver={activeDriver}
            loading={loading}
            error={error}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={nodePointerAreaPaint}
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
    </PageWrapper>
  )
}
