import { useState } from 'react'
import { countryFlag, countryCode } from '../../utils/flags'
import { safeString } from '../../utils/safeText'

/** Flag image with an outlined ISO-code fallback (never a filled box) when the country is unknown or the image fails. */
export default function CalendarFlag({ country }) {
  const [failed, setFailed] = useState(false)
  const url = countryFlag(country)
  if (url && !failed) {
    return <img src={url} alt="" width="28" height="20" className="h-5 w-7 shrink-0 rounded-[2px] object-cover" onError={() => setFailed(true)} />
  }
  const code = (countryCode(country) ?? safeString(country).slice(0, 2)).toUpperCase()
  if (!code) return <span aria-hidden="true" className="h-5 w-7 shrink-0" />
  return <span aria-hidden="true" className="inline-flex h-5 w-7 shrink-0 items-center justify-center rounded-[2px] border border-edge font-mono text-xs text-ink-2">{code}</span>
}
