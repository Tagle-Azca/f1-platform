import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { circuitType, TYPE_COLORS } from './constants'
import { makeIcon, MapController } from './MapController'

export default function CircuitsMapView({ filtered, sorted, selected, onSelect, isMobile }) {
  return (
    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>

      {/* Map */}
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
                eventHandlers={{ click: () => onSelect(c) }}
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

      {/* Sidebar — hidden on mobile */}
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
                    onClick={() => onSelect(c)}
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
  )
}
