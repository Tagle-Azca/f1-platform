import { Link } from 'react-router-dom'
import { safeColor } from '../../utils/safeUrl'

/**
 * DataRow — position / team bar / label / value row.
 * Team color is data: passed through the --team CSS variable only.
 *
 * Props: pos?, teamColor?, label, sub?, value?, to? (internal route), highlight?, className?
 */
export default function DataRow({ pos, teamColor, label, sub, value, to, onClick, highlight = false, className = '', children, ...rest }) {
  const cls = [
    'flex items-center gap-pw-3 min-h-12 px-pw-3 border-b border-edge-soft last:border-b-0 text-ink-2',
    highlight ? 'bg-steel-soft' : '',
    to || onClick ? 'no-underline hover:bg-white/5 transition-colors' : '',
    onClick ? 'w-full text-left bg-transparent border-0 cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')

  const body = (
    <>
      {pos != null && (
        <span className="w-6 shrink-0 text-right font-condensed font-bold text-sm text-ink-2 tabular-nums">{pos}</span>
      )}
      {safeColor(teamColor) && (
        <span aria-hidden="true" className="w-1 h-6 rounded-sm shrink-0 bg-[var(--team)]" style={{ '--team': safeColor(teamColor) }} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink truncate">{label}</span>
        {sub && <span className="block text-xs text-ink-3 truncate leading-4">{sub}</span>}
      </span>
      {children}
      {value != null && (
        <span className="shrink-0 font-mono text-sm font-medium text-ink tabular-nums">{value}</span>
      )}
    </>
  )

  if (to) return <Link to={to} className={cls} {...rest}>{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cls} {...rest}>{body}</button>
  return <div className={cls} {...rest}>{body}</div>
}
