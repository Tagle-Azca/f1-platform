import CircuitLoader from './CircuitLoader'

/**
 * EmptyState — centered loading / empty / error message.
 *
 * Props:
 *   message?  string       (never pass raw error text from exceptions)
 *   height?   number       pixel height, default 80 (dynamic value, stays inline)
 *   type?     'loading' | 'empty' | 'error'   default 'loading'
 *   action?   ReactNode    e.g. a retry Button
 */
export default function EmptyState({ message, height = 80, type = 'loading', page = false, action }) {
  if (type === 'loading') {
    return (
      <CircuitLoader
        message={message ?? 'Loading...'}
        size={height >= 180 ? 'md' : 'sm'}
        height={height}
        page={page}
      />
    )
  }

  const defaultMsg = type === 'error' ? 'Something went wrong' : 'No data available'

  return (
    <div
      className={`empty-state flex-col gap-pw-3 text-center px-pw-4 ${type === 'error' ? 'text-neg' : 'text-ink-3'}`}
      style={{ height }}
      role={type === 'error' ? 'alert' : undefined}
    >
      <span className="text-base">{message ?? defaultMsg}</span>
      {action}
    </div>
  )
}
