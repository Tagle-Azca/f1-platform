import TyreBadge from '../ui/TyreBadge'
import { Legend, BlockSwatch } from '../telemetry/TelemetrySection'
import { tyre } from '../../styles/vizPalette'

/** Compounds that appear in this race, plus the SC/VSC band keys when there were any. */
export default function CompoundLegend({ compounds, periods }) {
  const items = compounds.map(c => ({
    key: c,
    swatch: <TyreBadge compound={c} />,
    label: tyre(c)?.name ?? 'Not recorded',
  }))
  if (periods.some(p => p.type === 'SC')) items.push({ key: 'sc', swatch: <BlockSwatch color="var(--pw-orange)" />, label: 'Safety car' })
  if (periods.some(p => p.type === 'VSC')) items.push({ key: 'vsc', swatch: <BlockSwatch color="var(--pw-yellow)" />, label: 'Virtual safety car' })
  return <Legend items={items} />
}
