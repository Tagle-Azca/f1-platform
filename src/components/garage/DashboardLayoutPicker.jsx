import { useRef, useState } from 'react'
import { usePreferences } from '../../contexts/PreferencesContext'
import { WIDGET_REGISTRY, ALL_WIDGET_IDS, hasConstraintViolation, getUnifiedList, layoutFromUnified } from '../../utils/widgetRegistry'

const DEFAULT_LAYOUT = {
  order: ['cassandra', 'mongo', 'dgraph'], enabled: ['cassandra', 'mongo', 'dgraph'],
  featured: 'cassandra', sections: ['standings-row', 'db-cards'], standingsLeft: true,
}

const SECTION_META = {
  standings:   { label: 'Standings',  icon: '📊', desc: 'WDC · WCC' },
  lastSession: { label: 'Last Race',  icon: '🏁', desc: 'Most recent session' },
}

const SECTION_IDS = ['standings', 'lastSession']

function DragHandle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
      style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.18)', flexShrink: 0, cursor: 'grab' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  )
}

function DragGhost({ ghost }) {
  if (!ghost) return null
  return (
    <div style={{
      position: 'fixed', top: ghost.y + 14, left: ghost.x + 14,
      pointerEvents: 'none', zIndex: 9999,
      background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 6, padding: '4px 8px',
      fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
      whiteSpace: 'nowrap', backdropFilter: 'blur(8px)',
    }}>
      → {ghost.targetLabel}
    </div>
  )
}

export default function DashboardLayoutPicker() {
  const { prefs, setLayout } = usePreferences()
  const layout   = prefs.dashboardLayout ?? DEFAULT_LAYOUT
  const { enabled = [], featured = 'cassandra' } = layout

  const dragItem = useRef(null)
  const dragOver = useRef(null)
  const [ghost, setGhost] = useState(null)

  const unified        = getUnifiedList(layout)
  const disabledWidgets = ALL_WIDGET_IDS.filter(id => !enabled.includes(id))

  // ── Widget enable/disable ──
  function toggleWidget(id) {
    const isOn = enabled.includes(id)
    if (isOn) {
      const nextEnabled  = enabled.filter(e => e !== id)
      const nextOrder    = (layout.order ?? []).filter(o => o !== id)
      const nextFeatured = featured === id ? (nextOrder[0] ?? 'cassandra') : featured
      setLayout({ ...layout, enabled: nextEnabled, order: nextOrder, featured: nextFeatured })
    } else {
      setLayout({ ...layout, enabled: [...enabled, id], order: [...(layout.order ?? []), id] })
    }
  }

  // ── Drag & drop ──
  function dragStart(e, id) { dragItem.current = id; e.dataTransfer.effectAllowed = 'move' }
  function dragEnter(id)    { if (id !== dragItem.current) dragOver.current = id }
  function dragEnd() {
    if (dragItem.current && dragOver.current && dragItem.current !== dragOver.current) {
      const next = [...unified]
      const fi   = next.indexOf(dragItem.current)
      const ti   = next.indexOf(dragOver.current)
      next.splice(fi, 1); next.splice(ti, 0, dragItem.current)
      setLayout(layoutFromUnified(next, layout))
    }
    dragItem.current = null; dragOver.current = null; setGhost(null)
  }
  function dragMove(e, targetId) {
    if (!SECTION_IDS.includes(targetId)) {
      const order = layout.order ?? []
      const isFeaturedSlot = targetId === featured || order[0] === targetId
      setGhost({ x: e.clientX, y: e.clientY, targetLabel: isFeaturedSlot ? 'Featured (2-col)' : 'Side (1-col)' })
    } else {
      setGhost({ x: e.clientX, y: e.clientY, targetLabel: SECTION_META[targetId]?.label ?? targetId })
    }
  }

  function moveItem(id, dir) {
    const next = [...unified]
    const i = next.indexOf(id), j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setLayout(layoutFromUnified(next, layout))
  }

  const rowBase = (highlighted) => ({
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.5rem 0.6rem', borderRadius: 8, cursor: 'grab',
    border: `1px solid ${highlighted ? 'rgba(255,183,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
    background: highlighted ? 'rgba(255,183,0,0.06)' : 'rgba(255,255,255,0.03)',
    transition: 'border-color 0.15s, background 0.15s', userSelect: 'none',
  })

  return (
    <>
      <DragGhost ghost={ghost} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
          Drag to reorder · ★ = featured card · ✕ = hide widget
        </p>

        {/* ── Unified list ── */}
        {unified.map((id, i) => {
          const isSection = SECTION_IDS.includes(id)

          if (isSection) {
            const meta = SECTION_META[id]
            return (
              <div key={id} draggable style={rowBase(false)}
                onDragStart={e => dragStart(e, id)}
                onDragEnter={() => dragEnter(id)}
                onDragOver={e => { e.preventDefault(); dragMove(e, id) }}
                onDragEnd={dragEnd}
              >
                <DragHandle />
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2 }}>{meta.label}</div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>{meta.desc}</div>
                </div>
                <ArrowButtons i={i} total={unified.length} onMove={d => moveItem(id, d)} />
              </div>
            )
          }

          const w = WIDGET_REGISTRY[id]
          if (!w) return null
          const isFeatured  = featured === id
          const hasViolation = hasConstraintViolation(id, layout)
          return (
            <div key={id} draggable style={rowBase(isFeatured)}
              onDragStart={e => dragStart(e, id)}
              onDragEnter={() => dragEnter(id)}
              onDragOver={e => { e.preventDefault(); dragMove(e, id) }}
              onDragEnd={dragEnd}
            >
              <DragHandle />
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{w.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {w.label}
                  {hasViolation && <span title="Best in wide slot" style={{ fontSize: '0.6rem', color: '#fbbf24' }}>⚠</span>}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>{w.desc}</div>
              </div>
              <ArrowButtons i={i} total={unified.length} onMove={d => moveItem(id, d)} />
              {/* Featured star */}
              <button onClick={() => setLayout({ ...layout, featured: id })} title={isFeatured ? 'Featured' : 'Set as featured'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0, lineHeight: 1, opacity: isFeatured ? 1 : 0.25, transition: 'opacity 0.2s', filter: isFeatured ? 'drop-shadow(0 0 4px rgba(255,183,0,0.7))' : 'none' }}>
                ★
              </button>
              {/* Disable */}
              <button onClick={() => toggleWidget(id)} title="Hide widget"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0, lineHeight: 1, color: 'rgba(255,255,255,0.25)', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >✕</button>
            </div>
          )
        })}

        {/* ── Available (disabled) widgets ── */}
        {disabledWidgets.length > 0 && (
          <>
            <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', margin: '0.75rem 0 0.3rem' }}>
              Available widgets
            </div>
            {disabledWidgets.map(id => {
              const w = WIDGET_REGISTRY[id]
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', opacity: 0.5, userSelect: 'none' }}>
                  <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{w.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>{w.label}</div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)' }}>{w.desc}</div>
                  </div>
                  <button onClick={() => toggleWidget(id)}
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 5, cursor: 'pointer', padding: '2px 8px', fontSize: '0.62rem', fontWeight: 700, color: '#22c55e', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.22)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)' }}
                  >+ Add</button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}

function ArrowButtons({ i, total, onMove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {[[-1, '▲'], [1, '▼']].map(([d, a]) => (
        <button key={d} onClick={() => onMove(d)} disabled={d === -1 ? i === 0 : i === total - 1}
          style={{ width: 18, height: 14, borderRadius: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.22)', fontSize: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (d === -1 ? i === 0 : i === total - 1) ? 0.2 : 1 }}>
          {a}
        </button>
      ))}
    </div>
  )
}
