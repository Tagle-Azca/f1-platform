import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

/**
 * The only disclosure on Next race (below lg). From lg the section is open and the heading is plain text.
 * Sentence-case display heading, no eyebrow; the body stays mounted-but-hidden so it can be read once opened.
 */
export default function SectionDisclosure({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const bodyId = useId()
  const expanded = isLg || open
  return (
    <section className="section">
      <h2 className="text-heading text-ink">
        {isLg ? title : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(v => !v)}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-pw-3 border-0 bg-transparent p-0 text-left font-[inherit] text-[length:inherit] font-semibold text-ink"
          >
            <span>{title}</span>
            <ChevronDown aria-hidden="true" className={`size-5 text-ink-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </h2>
      <div id={bodyId} hidden={!expanded} className="mt-pw-3">{children}</div>
    </section>
  )
}
