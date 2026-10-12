export default function AuthDivider({ label = 'or' }) {
  return (
    <div className="flex items-center gap-pw-3" role="separator">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-xs text-ink-3 tracking-[0.08em] uppercase">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}
