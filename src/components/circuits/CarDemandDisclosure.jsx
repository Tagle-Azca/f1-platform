import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

/** Full-width section that is collapsed by default at every size (the detail page's one disclosure). */
export default function CarDemandDisclosure({ title = 'Car demand', children }) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <section className="section">
      <h2 className="text-heading text-ink">
        <button
          type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-pw-3 border-0 bg-transparent p-0 text-left font-[inherit] text-[length:inherit] font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel"
        >
          <span>{title}</span>
          <ChevronDown aria-hidden="true" className={`size-5 text-ink-3 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div id={bodyId} hidden={!open} className="mt-pw-3">{children}</div>
    </section>
  )
}
