import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate components.html into this component. */
export default function ComponentsPage() {
  return (
    <>
      <PageHeader title="Components" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>components.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
