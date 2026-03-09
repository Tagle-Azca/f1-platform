import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import PageWrapper from '../components/layout/PageWrapper'
import { circuitsApi } from '../services/api'

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

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

  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <h1 className="page__title" style={{ marginBottom: 0 }}>Circuits</h1>
        {!loading && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {valid.length} circuits worldwide
          </span>
        )}
        <span className="db-badge db-badge--mongo" style={{ marginLeft: 'auto' }}>MongoDB</span>
      </div>

      {loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading circuits...</p>
      )}

      {!loading && (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

          {/* Map */}
          <div style={{
            flex: 1, minWidth: 0, borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--border)', height: 560,
          }}>
            <MapContainer
              center={[20, 10]}
              zoom={2}
              minZoom={2}
              maxZoom={10}
              style={{ width: '100%', height: '100%', background: '#111' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {valid.map(c => {
                const lat  = parseFloat(c.Location?.lat  || c.lat)
                const lng  = parseFloat(c.Location?.long || c.long)
                const isSel = selected?.circuitId === c.circuitId
                return (
                  <CircleMarker
                    key={c.circuitId}
                    center={[lat, lng]}
                    radius={isSel ? 9 : 6}
                    pathOptions={{
                      color:       isSel ? '#fff' : '#e10600',
                      fillColor:   isSel ? '#e10600' : '#e10600',
                      fillOpacity: isSel ? 1 : 0.75,
                      weight:      isSel ? 2 : 1,
                    }}
                    eventHandlers={{ click: () => setSelected(c) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 150 }}>
                        <strong style={{ fontSize: '0.88rem' }}>{c.circuitName}</strong><br />
                        <span style={{ fontSize: '0.78rem', color: '#666' }}>
                          {c.Location?.locality || c.locality}, {c.Location?.country || c.country}
                        </span>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>

          {/* Sidebar list */}
          <div style={{ width: 230, flexShrink: 0, maxHeight: 560, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {valid
              .slice()
              .sort((a, b) => (a.Location?.country || a.country || '').localeCompare(b.Location?.country || b.country || ''))
              .map(c => {
                const isSel = selected?.circuitId === c.circuitId
                return (
                  <button
                    key={c.circuitId}
                    onClick={() => setSelected(isSel ? null : c)}
                    style={{
                      textAlign: 'left', background: isSel ? 'rgba(225,6,0,0.12)' : 'var(--bg-surface)',
                      border: `1px solid ${isSel ? 'rgba(225,6,0,0.4)' : 'var(--border)'}`,
                      borderRadius: 7, padding: '0.5rem 0.65rem',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                      {c.circuitName}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {c.Location?.locality || c.locality}, {c.Location?.country || c.country}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
