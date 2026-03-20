import { useState, useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { AnimatePresence } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import { circuitsApi } from '../services/api'
import { continent, circuitType } from '../components/circuits/constants'
import CircuitsFilters from '../components/circuits/CircuitsFilters'
import CircuitsMapView from '../components/circuits/CircuitsMapView'
import CircuitDetailPanel from '../components/circuits/CircuitDetailPanel'
import CircuitDNAPanel from '../components/circuits/CircuitDNAPanel'

export default function CircuitsPage() {
  const { isMobile } = useBreakpoint()
  const [circuits,   setCircuits]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [search,     setSearch]     = useState('')
  const [contFilter, setContFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    circuitsApi.getAll()
      .then(setCircuits)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const valid = circuits.filter(c => {
    const lat  = parseFloat(c.Location?.lat  || c.lat)
    const long = parseFloat(c.Location?.long || c.long)
    return !isNaN(lat) && !isNaN(long)
  })

  const filtered = valid.filter(c => {
    const country = c.Location?.country || c.country || ''
    const name    = c.circuitName || ''
    const loc     = c.Location?.locality || c.locality || ''
    const q       = search.toLowerCase()
    const matchSearch = !q || name.toLowerCase().includes(q) || country.toLowerCase().includes(q) || loc.toLowerCase().includes(q)
    const matchCont   = contFilter === 'All' || continent(country) === contFilter
    const matchType   = typeFilter === 'All' || circuitType(c.circuitId) === typeFilter.toLowerCase()
    return matchSearch && matchCont && matchType
  })

  const sorted = [...filtered].sort((a, b) =>
    (a.Location?.country || a.country || '').localeCompare(b.Location?.country || b.country || '')
  )

  function handleSelect(c) {
    setSelected(prev => prev?.circuitId === c.circuitId ? null : c)
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Circuits"
        subtitle={!loading ? `${valid.length} circuits across ${new Set(valid.map(c => c.Location?.country || c.country)).size} countries` : undefined}
      />

      <CircuitsFilters
        contFilter={contFilter}
        onContFilter={setContFilter}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        search={search}
        onSearch={setSearch}
      />

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>Loading circuits...</p>}

      {!loading && (
        <>
          <CircuitsMapView
            filtered={filtered}
            sorted={sorted}
            selected={selected}
            onSelect={handleSelect}
            isMobile={isMobile}
            contFilter={contFilter}
          />

          <AnimatePresence>
            {selected && <CircuitDetailPanel circuit={selected} onClose={() => setSelected(null)} />}
          </AnimatePresence>

          <AnimatePresence>
            {selected && <div style={{ marginTop: '0.75rem' }}><CircuitDNAPanel key={selected.circuitId} circuit={selected} /></div>}
          </AnimatePresence>
        </>
      )}
    </PageWrapper>
  )
}
