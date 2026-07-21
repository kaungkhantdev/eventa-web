import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate landing/minimal.html into this component. */
export default function MinimalPage() {
  return (
    <>
      <PageHeader title="Minimal" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>landing/minimal.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
