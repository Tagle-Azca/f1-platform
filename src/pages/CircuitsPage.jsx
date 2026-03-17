import { useState, useEffect } from 'react'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import PageWrapper from '../components/layout/PageWrapper'
import PageHeader from '../components/layout/PageHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { circuitsApi } from '../services/api'
import { continent, circuitType, CONTINENT_FILTERS, TYPE_FILTERS, TYPE_COLORS } from '../components/circuits/constants'
import { makeIcon, MapController } from '../components/circuits/MapController'
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

      {/* ── Filters ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {CONTINENT_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setContFilter(f)}
              style={{
                padding: '0.28rem 0.8rem', borderRadius: 99, border: '1px solid',
                borderColor: contFilter === f ? 'var(--f1-red)' : 'var(--border-color)',
                background:  contFilter === f ? 'rgba(225,6,0,0.12)' : 'transparent',
                color:       contFilter === f ? 'var(--f1-red)' : 'var(--text-muted)',
                fontFamily:  "'Barlow Condensed', sans-serif",
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
          <input
            className="input"
            placeholder="Search circuit or country..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', width: 220, fontSize: '0.82rem', padding: '0.28rem 0.75rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            fontFamily: "'Barlow Condensed', sans-serif", marginRight: '0.2rem',
          }}>Type:</span>
          {TYPE_FILTERS.map(t => {
            const c = typeFilter === t ? (TYPE_COLORS[t.toLowerCase()] || 'var(--f1-red)') : 'var(--text-muted)'
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '0.22rem 0.7rem', borderRadius: 99, border: '1px solid',
                  borderColor: typeFilter === t ? c : 'var(--border-color)',
                  background:  typeFilter === t ? `${c}20` : 'transparent',
                  color:       c,
                  fontFamily:  "'Barlow Condensed', sans-serif",
                  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>Loading circuits...</p>}

      {!loading && (
        <>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>

            {/* ── Map ──────────────────────────────────── */}
            <div style={{
              flex: 1, minWidth: 0, borderRadius: 12, overflow: 'hidden', isolation: 'isolate',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 0 40px rgba(0,0,0,0.5)',
              height: isMobile ? 'calc(100vh - 180px)' : 530, position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, transparent, var(--f1-red), transparent)',
                zIndex: 1000, pointerEvents: 'none',
              }} />

              <MapContainer center={[25, 15]} zoom={2} minZoom={2} maxZoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                <MapController target={selected} />

                {filtered.map(c => {
                  const lat   = parseFloat(c.Location?.lat  || c.lat)
                  const lng   = parseFloat(c.Location?.long || c.long)
                  const isSel = selected?.circuitId === c.circuitId
                  return (
                    <Marker
                      key={c.circuitId}
                      position={[lat, lng]}
                      icon={makeIcon(isSel)}
                      zIndexOffset={isSel ? 1000 : 0}
                      eventHandlers={{ click: () => handleSelect(c) }}
                    >
                      <Popup>
                        <div>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#f0f0f0', marginBottom: 4, lineHeight: 1.1 }}>
                            {c.circuitName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#999', marginBottom: c.raceCount ? 8 : 0 }}>
                            {c.Location?.locality || c.locality}, {c.Location?.country || c.country}
                          </div>
                          {c.raceCount > 0 && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(225,6,0,0.12)', border: '1px solid rgba(225,6,0,0.25)', borderRadius: 4, padding: '2px 8px' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#e10600' }} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e10600', fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {c.raceCount} races
                              </span>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>

              <div style={{
                position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
                background: 'rgba(8,8,8,0.85)', border: '1px solid var(--border-color)',
                borderRadius: 7, padding: '0.35rem 0.7rem', backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  {filtered.length} circuit{filtered.length !== 1 ? 's' : ''} shown
                </span>
              </div>
            </div>

            {/* ── Sidebar — hidden on mobile ────────────── */}
            {!isMobile && (
              <div style={{
                width: 220, flexShrink: 0,
                background: 'var(--surface-2)', border: '1px solid var(--border-color)',
                borderRadius: 12, overflow: 'hidden', height: 530,
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  padding: '0.75rem 0.9rem', borderBottom: '1px solid var(--border-color)',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                }}>
                  {sorted.length} circuits
                </div>
                <ScrollArea style={{ flex: 1 }}>
                  <div style={{ padding: '0.4rem' }}>
                    {sorted.map(c => {
                      const isSel = selected?.circuitId === c.circuitId
                      const tc    = TYPE_COLORS[circuitType(c.circuitId)]
                      return (
                        <button
                          key={c.circuitId}
                          onClick={() => handleSelect(c)}
                          style={{
                            width: '100%', textAlign: 'left',
                            background: isSel ? 'rgba(225,6,0,0.1)' : 'transparent',
                            border: `1px solid ${isSel ? 'rgba(225,6,0,0.3)' : 'transparent'}`,
                            borderRadius: 7, padding: '0.5rem 0.6rem',
                            cursor: 'pointer', transition: 'all 0.12s', marginBottom: 2,
                          }}
                          onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--surface-3)' }}
                          onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: isSel ? 'var(--f1-red)' : tc,
                              boxShadow: isSel ? '0 0 6px rgba(225,6,0,0.8)' : `0 0 4px ${tc}80`,
                              transition: 'all 0.15s',
                            }} />
                            <div style={{
                              fontSize: '0.76rem', fontWeight: isSel ? 700 : 500,
                              color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                              lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {c.circuitName}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, paddingLeft: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{c.Location?.country || c.country}</span>
                            {c.raceCount > 0 && (
                              <span style={{ color: isSel ? 'rgba(225,6,0,0.7)' : 'var(--border-strong)', fontWeight: 600 }}>
                                {c.raceCount}×
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <AnimatePresence>
            {selected && <CircuitDetailPanel circuit={selected} onClose={() => setSelected(null)} />}
          </AnimatePresence>

          <AnimatePresence>
            {selected && <CircuitDNAPanel key={selected.circuitId} circuit={selected} />}
          </AnimatePresence>
        </>
      )}
    </PageWrapper>
  )
}
