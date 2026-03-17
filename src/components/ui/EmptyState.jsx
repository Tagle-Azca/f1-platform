import CircuitLoader from './CircuitLoader'

/**
 * EmptyState — centered loading / empty / error message.
 *
 * Props:
 *   message?  string
 *   height?   number   pixel height, default 80
 *   type?     'loading' | 'empty' | 'error'   default 'loading'
 */
export default function EmptyState({ message, height = 80, type = 'loading' }) {
  if (type === 'loading') {
    return (
      <CircuitLoader
        message={message ?? 'Loading...'}
        size={height >= 180 ? 'md' : 'sm'}
        height={height}
      />
    )
  }

  const defaultMsg = type === 'error' ? 'Something went wrong' : 'No data available'
  const color      = type === 'error' ? 'var(--f1-red)' : 'var(--text-muted)'

  return (
    <div className="empty-state" style={{ height, color }}>
      <span style={{ fontSize: 'var(--text-base)' }}>
        {message ?? defaultMsg}
      </span>
    </div>
  )
}
