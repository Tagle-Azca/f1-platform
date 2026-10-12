import SectionHeader from './SectionHeader'

/**
 * Panel — elevated surface card using design system tokens.
 *
 * Props:
 *   accent?   'red' | 'mongo' | 'cassandra' | 'dgraph'  — colored top border
 *   padding?  'none' | 'sm' | 'md' | 'lg'               — default 'md'
 *   as?       string                                      — HTML tag, default 'div'
 *   title?    string      — optional SectionHeader (h2) inside the panel
 *   actions?  ReactNode   — right-aligned slot in the header (share/pin; gated by features.social)
 *   className? string
 *   style?    object      — dynamic values only
 *   children  ReactNode
 */
export default function Panel({
  accent,
  padding = 'md',
  as: Tag = 'div',
  title,
  actions,
  className = '',
  style,
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
      {(title || actions) && <SectionHeader title={title} actions={actions} />}
      {children}
    </Tag>
  )
}
