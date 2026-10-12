import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Escape-to-close + focus trap for a drawer/dialog. Returns a ref to attach
 * to the dialog container. Restores focus to the triggering element on close.
 */
export function useFocusTrap(active, onClose) {
  const containerRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!active) return
    restoreRef.current = document.activeElement
    const container = containerRef.current
    const getFocusable = () => Array.from(container?.querySelectorAll(FOCUSABLE) ?? [])

    const raf = requestAnimationFrame(() => {
      (getFocusable()[0] ?? container)?.focus?.()
    })

    function onKeyDown(e) {
      if (e.key === 'Escape') { onClose?.(); return }
      if (e.key !== 'Tab') return
      const els = getFocusable()
      if (!els.length) return
      const first = els[0], last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      restoreRef.current?.focus?.()
    }
  }, [active, onClose])

  return containerRef
}
