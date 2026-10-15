import PageWrapper from '../layout/PageWrapper'
import Panel from '../ui/Panel'
import VizSkeleton from '../viz/VizSkeleton'

/** Loading shape of a race weekend: hero and two sections, so the real page replaces it without a jump. */
export default function WeekendSkeleton({ label = 'Loading race weekend' }) {
  return (
    <PageWrapper stagger>
      <h1 className="sr-only">Race weekend</h1>
      <div aria-busy="true" className="flex flex-col gap-pw-7">
        <Panel as="section" aria-label="Race weekend"><VizSkeleton variant="hero" name="race weekend" /></Panel>
        <section className="section"><h2 className="text-heading mb-pw-3 text-ink">Weekend schedule</h2><VizSkeleton variant="timeline" name="schedule" /></section>
        <VizSkeleton variant="rows" name="session results" count={4} />
      </div>
      <p role="status" aria-live="polite" className="sr-only">{label}</p>
    </PageWrapper>
  )
}
