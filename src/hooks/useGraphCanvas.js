import { useCallback } from 'react'
import { COLOR } from '../utils/graphLayout'

function drawLabel(ctx, node, radius, globalScale, isSelf, isTeam) {
  const minScale = isSelf ? 0 : isTeam ? 0.4 : 0.55
  if (globalScale < minScale && !isSelf) return
  const fontSize = isSelf ? Math.max(13, 15 / globalScale)
                 : isTeam ? Math.max(9,  11 / globalScale)
                 :          Math.max(8,   9 / globalScale)
  ctx.font      = `${isSelf || isTeam ? 700 : 400} ${fontSize}px Inter,sans-serif`
  ctx.fillStyle = isSelf ? '#fff' : isTeam ? '#f59e0b' : 'rgba(255,255,255,0.75)'
  ctx.textAlign = 'center'
  ctx.fillText(node.name, node.x, node.y + radius + fontSize + 1)
}

export function useGraphCanvas(imgCacheRef, fgRef) {
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isSelf = node.isSelf
    const isTeam = node.type === 'Team'
    const isTm   = node.type === 'Teammate'
    const color  = COLOR[isSelf ? 'Driver' : node.type] || '#888'
    const radius = isSelf ? 36 : isTeam ? 9 : 7

    if (isSelf) {
      ctx.shadowBlur  = 40
      ctx.shadowColor = color
    }

    const cacheKey = node.id
    if (node.photoUrl && (isSelf || isTm)) {
      const cached = imgCacheRef.current[cacheKey]
      if (!cached) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload  = () => { imgCacheRef.current[cacheKey] = img; fgRef.current?.refresh() }
        img.onerror = () => { imgCacheRef.current[cacheKey] = 'error' }
        img.src     = node.photoUrl
        imgCacheRef.current[cacheKey] = 'loading'
      } else if (cached instanceof HTMLImageElement) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
        ctx.clip()
        ctx.drawImage(cached, node.x - radius, node.y - radius, radius * 2, radius * 2)
        ctx.restore()
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
        ctx.strokeStyle = color
        ctx.lineWidth   = isSelf ? 2.5 : 1.5
        ctx.stroke()
        ctx.shadowBlur = 0
        drawLabel(ctx, node, radius, globalScale, isSelf, isTeam)
        return
      }
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.shadowBlur = 0

    if (isTm) {
      const initials = node.name.split(' ').map(w => w[0]).join('').slice(0, 2)
      const fs = Math.max(5, radius * 0.85)
      ctx.font         = `700 ${fs}px Inter,sans-serif`
      ctx.fillStyle    = '#fff'
      ctx.textAlign    = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initials, node.x, node.y)
      ctx.textBaseline = 'alphabetic'
    }

    drawLabel(ctx, node, radius, globalScale, isSelf, isTeam)
  }, [imgCacheRef, fgRef])

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.isSelf ? 38 : 10, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  return { nodeCanvasObject, nodePointerAreaPaint }
}
