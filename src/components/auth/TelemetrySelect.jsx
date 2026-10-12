export default function TelemetrySelect({ value, onChange, options, placeholder, label }) {
  return (
    <div className="relative">
      <select
        value={value} onChange={onChange} required
        aria-label={label ?? placeholder}
        className={[
          'w-full min-h-11 appearance-none cursor-pointer rounded-sm bg-white/5 border border-white/20',
          'py-pw-2 pl-pw-3 pr-7 font-condensed text-sm font-bold tracking-[0.06em]',
          'focus-visible:outline-2 focus-visible:outline-steel focus-visible:outline-offset-2',
          value ? 'text-ink' : 'text-ink-3',
        ].join(' ')}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt} className="bg-panel text-ink">
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3"
        width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  )
}
