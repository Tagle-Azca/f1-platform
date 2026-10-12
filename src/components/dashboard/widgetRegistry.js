import {
  HeroWidget, LiveConsoleWidget, TitleFightWidget, LastSessionWidget, StandingsWidget, GoDeeperWidget,
} from './widgets'

/**
 * Extension point for Dashboard personalization ("My Pitwall", features.myPitwall).
 * The Dashboard renders ONLY from this ordered list, so a per-user order / pin list
 * (stored in `preferences`) can reorder or hide widgets without touching the page.
 *
 * Entry shape:
 *   id             stable key (used by saved layouts)
 *   title          human label (also the accessible name where a heading is not rendered)
 *   component      ({ ctx }) => ReactNode
 *   minWidth       px; the widget is not rendered below this viewport width
 *   hiddenAt       px; the widget is removed from the tree at/above this width
 *                  (so assistive tech never sees duplicate content: the xl rail already shows standings)
 *   showWhen       'live' => only while a session is live
 *   defaultVisible whether it shows when the user has no saved layout
 *   className      static grid placement classes (kept literal so Tailwind can see them)
 *
 * Mobile order is the array order (single column).
 */
export const WIDGET_REGISTRY = [
  { id: 'hero',        title: 'Live now / Next session', component: HeroWidget,        minWidth: 0,    defaultVisible: true, className: 'lg:col-span-12' },
  { id: 'liveConsole', title: 'Live console',            component: LiveConsoleWidget, minWidth: 1024, defaultVisible: true, showWhen: 'live', className: 'lg:col-span-12' },
  { id: 'titleFight',  title: 'Title fight',             component: TitleFightWidget,  minWidth: 0,    defaultVisible: true, className: 'lg:col-span-12' },
  { id: 'lastSession', title: 'Last session',            component: LastSessionWidget, minWidth: 0,    defaultVisible: true, className: 'lg:col-span-7' },
  { id: 'standings',   title: 'Standings',               component: StandingsWidget,   minWidth: 0,    hiddenAt: 1280, defaultVisible: true, className: 'lg:col-span-5' },
  { id: 'goDeeper',    title: 'Go deeper',               component: GoDeeperWidget,    minWidth: 0,    defaultVisible: true, className: 'lg:col-span-12 xl:col-span-5' },
]

/**
 * Pure selector: which widgets render, in which order.
 * `layout` is the future per-user override: { order?: string[], hidden?: string[] }.
 */
export function getDashboardWidgets({ width, isLive = false, layout = null, registry = WIDGET_REGISTRY } = {}) {
  let list = registry.filter(w => {
    if (!w.defaultVisible) return false
    if (layout?.hidden?.includes(w.id)) return false
    if (w.minWidth && width < w.minWidth) return false
    if (w.hiddenAt && width >= w.hiddenAt) return false
    if (w.showWhen === 'live' && !isLive) return false
    return true
  })
  if (layout?.order?.length) {
    const rank = (id) => { const i = layout.order.indexOf(id); return i === -1 ? Infinity : i }
    list = [...list].sort((a, b) => rank(a.id) - rank(b.id))
  }
  return list
}
