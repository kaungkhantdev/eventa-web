import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate landing/aurora.html into this component. */
export default function AuroraPage() {
  return (
    <>
      <PageHeader title="Aurora" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>landing/aurora.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
