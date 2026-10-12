import { useId } from 'react'
import { AuthFieldContext } from './authFieldContext'

export default function AuthField({ label, children }) {
  const id = useId()
  return (
    <AuthFieldContext.Provider value={id}>
      <div className="flex flex-col gap-pw-2">
        <label htmlFor={id} className="text-xs font-bold tracking-[0.1em] uppercase text-ink-3">
          {label}
        </label>
        {children}
      </div>
    </AuthFieldContext.Provider>
  )
}
