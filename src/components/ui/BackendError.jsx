/** Generic backend-unavailable panel. Copy is static: never echoes raw errors. */
export default function BackendError({ onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-pw-3 px-pw-4 py-pw-8 text-center">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-12 h-12 opacity-90">
        <rect x="10" y="8" width="4" height="48" rx="2" fill="currentColor" className="text-ink-3" />
        <rect x="14" y="8" width="36" height="22" rx="2" fill="currentColor" className="text-live" />
        <rect x="14" y="8"  width="12" height="11" fill="rgba(0,0,0,.25)" />
        <rect x="26" y="19" width="12" height="11" fill="rgba(0,0,0,.25)" />
        <rect x="38" y="8"  width="12" height="11" fill="rgba(0,0,0,.25)" />
      </svg>
      <div>
        <p className="font-condensed text-2xl font-black tracking-[0.08em] uppercase leading-none text-ink">
          Safety Car Deployed
        </p>
        <p className="text-sm text-ink-3 mt-pw-2">The pit wall is unreachable. Check back shortly.</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
