import { PageHeader, PageFooter, Card } from '@/components/ui'

/** TODO(port): translate primary-ui/home.html into this component. */
export default function PrimaryHomePage() {
  return (
    <>
      <PageHeader title="Primary UI · Home" />
      <Card className="p-6">
        <p className="text-[13px] text-muted">
          Not ported yet — source: <code>primary-ui/home.html</code>
        </p>
      </Card>
      <PageFooter />
    </>
  )
}
