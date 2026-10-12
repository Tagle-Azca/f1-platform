import { useId, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { ChevronDown } from 'lucide-react'
import Panel from './Panel'

/**
 * Disclosure — collapsible Panel section for mobile.
 * Below `lg` it is a button (aria-expanded / aria-controls) that toggles the body;
 * from `lg` the section is always open and the heading is plain text.
 */
export default function Disclosure({ title, meta, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const bodyId = useId()
  const expanded = isLg || open

  return (
    <Panel as="section" padding="none" className="flex flex-col">
      <h2 className="m-0">
        {isLg ? (
          <span className="flex items-baseline justify-between gap-pw-3 px-pw-4 pt-pw-4 pb-pw-2 font-condensed text-xs font-bold uppercase tracking-[0.08em] text-ink-3">
            <span>{title}</span>{meta && <span className="normal-case tracking-normal font-normal">{meta}</span>}
          </span>
        ) : (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen(v => !v)}
            className="flex w-full min-h-12 items-center justify-between gap-pw-3 px-pw-4 bg-transparent border-0 cursor-pointer text-left font-condensed text-xs font-bold uppercase tracking-[0.08em] text-ink-2"
          >
            <span>{title}</span>
            <span className="flex items-center gap-pw-2">
              {meta && <span className="normal-case tracking-normal font-normal text-ink-3">{meta}</span>}
              <ChevronDown aria-hidden="true" className={`size-4 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} />
            </span>
          </button>
        )}
      </h2>
      <div id={bodyId} hidden={!expanded} className="px-pw-4 pb-pw-4 flex-1">
        {children}
      </div>
    </Panel>
  )
}
