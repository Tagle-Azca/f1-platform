/** Inline form error. `id` is referenced by the inputs through aria-describedby. */
export default function AuthError({ message, id = 'auth-error' }) {
  if (!message) return null
  return (
    <div id={id} role="alert" className="rounded-sm border border-live bg-live-soft px-pw-3 py-pw-2 text-sm text-ink">
      {message}
    </div>
  )
}
