import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate landing/noir.html into this component. */
export default function NoirPage() {
  return (
    <>
      <PageHeader title="Noir" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>landing/noir.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
