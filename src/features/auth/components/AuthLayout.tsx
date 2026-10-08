import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, IconButton } from '@/components/ui'
import { useTheme } from '@/lib/useTheme'

/* Shared chrome for the standalone auth screens: a fixed theme toggle, the
   centered brand lockup + heading, and the card slot. These pages render
   outside AdminShell, so each supplies its own theme control. Ported from the
   identical <body> shell in auth/login.html, register.html and
   forgot-password.html. */

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  homeTo = '/',
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  /** Where the brand lockup links. Admin auth → '/'; the portal login points
   *  it at the attendee home so signing-in flows never touch the admin side. */
  homeTo?: string
}) {
  const { dark, toggle } = useTheme()

  return (
    <>
      <IconButton
        onClick={toggle}
        title="Change mode"
        className="fixed right-4 top-4 z-10 bg-surface"
      >
        <Icon name={dark ? 'hgi-sun-03' : 'hgi-moon-02'} size={18} />
      </IconButton>

      <div className="grid min-h-screen place-items-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-sm">
          {/* logo + heading */}
          <div className="mb-7 flex flex-col items-center gap-4 text-center">
            <Link to={homeTo} className="flex items-center gap-2">
              <span className="brand-logo text-brand h-[20px] w-[37px]" />
              <span className="text-[18px] font-extrabold text-brand-dark">Eventa</span>
            </Link>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
            </div>
          </div>

          {/* card */}
          <div className="card p-6">{children}</div>

          {footer}
        </div>
      </div>
    </>
  )
}
