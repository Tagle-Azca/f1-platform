import { useContext } from 'react'
import { AuthFieldContext } from './authFieldContext'

// variant='underline' → borderBottom only (register page)
// variant='box'       → full bordered box (login modal)
// Attributes such as autoComplete / type / required pass straight through.
export default function AuthInput({ variant = 'box', rightSlot, className = '', ...props }) {
  const fieldId = useContext(AuthFieldContext)
  const base = 'w-full min-h-11 text-ink text-base font-mono bg-transparent placeholder:text-ink-3 focus-visible:outline-2 focus-visible:outline-steel focus-visible:outline-offset-2'
  const look = variant === 'underline'
    ? `border-0 border-b border-b-white/20 rounded-none py-pw-2 ${rightSlot ? 'pr-10' : 'pr-0'}`
    : `border border-white/20 bg-white/5 rounded-sm py-pw-2 pl-pw-3 ${rightSlot ? 'pr-12' : 'pr-pw-3'}`

  return (
    <div className="relative">
      <input id={fieldId ?? undefined} {...props} className={`${base} ${look} ${className}`} />
      {rightSlot && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${variant === 'underline' ? 'right-0' : 'right-pw-1'}`}>
          {rightSlot}
        </div>
      )}
    </div>
  )
}
