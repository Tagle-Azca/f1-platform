import { useEffect, useState } from 'react'

export default function ScrollFade() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function check() {
      const scrolled = window.scrollY + window.innerHeight
      const total    = document.documentElement.scrollHeight
      setVisible(total - scrolled > 60)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 80,
      background: 'linear-gradient(to bottom, transparent, var(--bg-base))',
      pointerEvents: 'none',
      zIndex: 40,
    }} />
  )
}
