/**
 * SectionHeader — small uppercase label (h2 by default) with an optional
 * right-aligned actions slot. 12px, ink-3 (AA on every surface).
 */
export default function SectionHeader({ title, actions, as: Tag = 'h2', className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-pw-3 mb-pw-3 ${className}`}>
      {title && (
        <Tag className="font-condensed text-xs font-bold uppercase tracking-[0.08em] text-ink-3 leading-4">
          {title}
        </Tag>
      )}
      {actions && <div className="flex items-center gap-pw-2 shrink-0">{actions}</div>}
    </div>
  )
}
