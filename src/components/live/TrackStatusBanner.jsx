import { trackStatusInfo } from './trackStatus'

export default function TrackStatusBanner({ status, className = '' }) {
  const cfg = trackStatusInfo(status)
  if (!cfg) return null
  return (
    <div className={`status-banner ${cfg.tone} ${className}`}>
      <span aria-hidden="true" className="status-banner__dot" />
      <span className="status-banner__label">{cfg.label}</span>
    </div>
  )
}
