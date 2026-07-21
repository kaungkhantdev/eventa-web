import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate landing/atlas.html into this component. */
export default function AtlasPage() {
  return (
    <>
      <PageHeader title="Atlas" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>landing/atlas.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
