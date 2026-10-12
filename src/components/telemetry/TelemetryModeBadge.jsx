/** Which data source the page is reading, in words. */
export default function TelemetryModeBadge({ isHistorical }) {
  return (
    <span className="inline-flex min-h-6 self-start md:self-auto items-center rounded-pill border border-edge px-pw-3 text-xs font-medium text-ink-2">
      {isHistorical ? 'Season archive · lap data starts in 2023' : 'Lap-by-lap data'}
    </span>
  )
}
