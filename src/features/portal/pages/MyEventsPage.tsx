import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate portal/my-events.html into this component. */
export default function MyEventsPage() {
  return (
    <>
      <PageHeader title="My events" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>portal/my-events.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
