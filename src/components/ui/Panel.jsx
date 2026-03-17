/**
 * Panel — elevated surface card using design system tokens.
 * Replaces all inline `background: rgba(22,22,22,0.9), border: ...` patterns.
 *
 * Props:
 *   accent?   'red' | 'mongo' | 'cassandra' | 'dgraph'  — colored top border
 *   padding?  'none' | 'sm' | 'md' | 'lg'               — default 'md'
 *   as?       string                                      — HTML tag, default 'div'
 *   className? string
 *   style?    object
 *   children  ReactNode
 */
export default function Panel({
  accent,
  padding = 'md',
  as: Tag = 'div',
  className = '',
  style = {},
  children,
  ...rest
}) {
  const classes = [
    'panel',
    padding !== 'none' ? `panel--${padding}` : '',
    accent  ? `panel--${accent}` : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Tag className={classes} style={style} {...rest}>
      {children}
    </Tag>
  )
}
