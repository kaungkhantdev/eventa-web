import { Link, useNavigate } from 'react-router'
import { Icon } from '@/components/ui'
import { useTheme } from '@/lib/useTheme'

/** Port of the static kit's root 404.html — standalone, no admin shell. */
export default function NotFoundPage() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-canvas">
      <button
        type="button"
        onClick={toggle}
        title="Toggle theme"
        className="btn-icon fixed right-4 top-4 z-10 bg-surface"
      >
        <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
      </button>

      <main className="grid min-h-screen place-items-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          <Link to="/admin/home" className="inline-flex items-center gap-2" title="Eventa home">
            <span className="brand-logo h-[20px] w-[37px] text-brand" />
            <span className="text-[17px] font-extrabold tracking-tight text-ink">Eventa</span>
          </Link>

          <div className="mt-10 flex justify-center">
            <span className="grid h-20 w-20 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Icon name="hgi-compass-01" size={40} />
            </span>
          </div>

          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.2em] text-brand">
            Error 404
          </p>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-ink sm:text-[32px]">
            Page not found
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-muted">
            The page you're looking for doesn't exist, was moved, or might still be under
            construction.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Link to="/admin/home" className="btn btn-primary w-full sm:w-auto">
              <Icon name="hgi-home-01" />
              Back to home
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-soft w-full sm:w-auto"
            >
              <Icon name="hgi-arrow-left-01" />
              Go back
            </button>
          </div>

          <p className="mt-8 text-[12px] text-muted">
            Still stuck?{' '}
            <Link to="/admin/settings-profile" className="font-semibold text-brand hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
