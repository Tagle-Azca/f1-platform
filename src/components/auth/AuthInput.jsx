import { useState } from 'react'

// variant='underline' → borderBottom only (register page)
// variant='box'       → full bordered box (login modal)
export default function AuthInput({ variant = 'box', rightSlot, ...props }) {
  const [focused, setFocused] = useState(false)

  const boxStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focused ? 'rgba(225,6,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    padding: `0.65rem ${rightSlot ? '2.5rem' : '0.85rem'} 0.65rem 0.85rem`,
  }

  const underlineStyle = {
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${focused ? 'rgba(225,6,0,0.6)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: 0,
    padding: `0.55rem ${rightSlot ? '2.25rem' : '0'} 0.55rem 0`,
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...props}
        style={{
          width: '100%', boxSizing: 'border-box',
          color: 'var(--text-primary)', fontSize: '0.88rem',
          fontFamily: 'monospace', outline: 'none',
          transition: 'border-color 0.2s',
          ...(variant === 'underline' ? underlineStyle : boxStyle),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightSlot && (
        <div style={{ position: 'absolute', right: variant === 'underline' ? 0 : '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
          {rightSlot}
        </div>
      )}
    </div>
  )
}
