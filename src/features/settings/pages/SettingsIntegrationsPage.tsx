import { useEffect, useRef } from 'react'
import { useFetcher, useLoaderData, useRouteLoaderData, useSearchParams } from 'react-router'
import { Badge, Button, Card, Icon, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { useDisclosure } from '@/lib/useDisclosure'
import { useFailureToast, useSavedToast } from '@/lib/useSavedToast'
import { ADMIN_ROUTE_ID, type ActionResult } from '@/app/loaders'
import type { Me } from '@/features/auth/types'
import { SettingsHeader } from '../components/SettingsHeader'
import { authorizeUrlOf, returnToastOf, toCalendarConnectionCard, type CalendarConnectionCard } from '../calendarConnection.mapper'
import { canManageIntegrations } from '../integrationsAccess'
import { type IntegrationsData } from '../settings.routes'
import { BLURB, CALENDAR_RETURN_PARAM, CONNECT_CALENDAR_INTENT, DISCONNECT_CALENDAR_INTENT, TILE_TINT } from '@/lib/constants/settings.constants'

/**
 * Settings → Integrations (US-MTG-08): where an Admin connects, reconnects and
 * disconnects the workspace's Google Calendar, which sends every meeting's
 * invite and makes its Meet link.
 *
 * The kit has no page for this. The card is the Payments page's provider panel
 * — tile, badge, blurb, facts, action — copied here rather than imported, so
 * neither page's layout is tied to the other's.
 *
 * Connecting leaves the console: the API answers with Google's consent page,
 * Google sends the browser back to the API, and the API redirects here with a
 * single word in `?calendar=` that this page announces and then removes. No
 * code, token or address ever reaches the browser.
 */
export default function SettingsIntegrationsPage() {
  const { connection } = useLoaderData() as IntegrationsData
  const me = (useRouteLoaderData(ADMIN_ROUTE_ID) as { me: Me } | undefined)?.me ?? null
  useCalendarReturnToast()

  return (
    <>
      <SettingsHeader
        title="Integrations"
        subtitle="Connect the services this workspace works with."
      />
      {/* A grid of one for now: a card stretched across the whole console
          would leave its facts a screen-width apart from their labels. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <GoogleCalendarCard
          card={toCalendarConnectionCard(connection, canManageIntegrations(me))}
        />
      </div>
    </>
  )
}

/**
 * Announce how the trip to Google ended, once, then take the word out of the
 * URL so a reload or a shared link does not announce it again. StrictMode's
 * double effect is folded by the toast store, which keys on the message.
 */
function useCalendarReturnToast() {
  const [params, setParams] = useSearchParams()
  const outcome = params.get(CALENDAR_RETURN_PARAM)

  useEffect(() => {
    if (outcome === null) return
    const note = returnToastOf(outcome)
    if (note) toast[note.tone](note.message)
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(CALENDAR_RETURN_PARAM)
        return next
      },
      { replace: true },
    )
  }, [outcome, setParams])
}

function GoogleCalendarCard({ card }: { card: CalendarConnectionCard }) {
  // Held here, not in the buttons: a disconnect that worked removes its own
  // button on the revalidation that follows, and a toast hook inside it would
  // unmount before it could announce anything.
  const disconnect = useDisconnect()

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', TILE_TINT)}
        >
          <Icon name="hgi-calendar-03" size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight">Google Calendar</h2>
          <Badge tone={card.statusTone}>{card.statusLabel}</Badge>
        </div>
      </div>

      <p className="mt-2.5 text-[12px] text-muted">{BLURB}</p>

      {card.note && <p className="mt-2 text-[12px] text-muted">{card.note}</p>}
      {card.warning && (
        <p role="alert" className="mt-2 text-[12px] text-amber-600">
          {card.warning}
        </p>
      )}

      {card.showFacts && (
        <dl className="mt-3 space-y-1.5 border-t border-hair pt-3 text-[12px]">
          <Fact label="Account" value={card.account} />
          <Fact label="Connected" value={card.connectedOn} />
        </dl>
      )}

      {card.adminNote && <p className="mt-3 text-[12px] text-muted">{card.adminNote}</p>}

      {(card.primary || card.canDisconnect) && (
        <div className="mt-3 flex gap-2">
          {card.primary && <ConnectButton kind={card.primary} />}
          {card.canDisconnect && (
            <DisconnectButton busy={disconnect.busy} onConfirm={disconnect.run} />
          )}
        </div>
      )}
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate font-semibold text-ink">{value}</dd>
    </div>
  )
}

const CONNECT_LABEL: Record<NonNullable<CalendarConnectionCard['primary']>, string> = {
  connect: 'Connect Google Calendar',
  reconnect: 'Reconnect',
}

/**
 * Ask the API where Google's consent page is, then go there.
 *
 * Its own fetcher, so a refusal — the server has no Google client after all —
 * is announced under this button's name and not the disconnect's.
 */
function ConnectButton({ kind }: { kind: NonNullable<CalendarConnectionCard['primary']> }) {
  const connect = useFetcher<ActionResult>()
  const settled = connect.state === 'idle' ? connect.data : undefined
  const authorizeUrl = authorizeUrlOf(settled)
  useFailureToast(settled?.ok === false ? settled.error : null)

  // Once per answer. Each connect mints a new state, so a second click is a
  // second address; the same one is never followed twice.
  const followed = useRef<string | null>(null)
  useEffect(() => {
    if (!authorizeUrl || followed.current === authorizeUrl) return
    followed.current = authorizeUrl
    window.location.assign(authorizeUrl)
  }, [authorizeUrl])

  const busy = connect.state !== 'idle'
  return (
    <Button
      variant="primary"
      size="sm"
      className="flex-1"
      disabled={busy}
      onClick={() => connect.submit({ intent: CONNECT_CALENDAR_INTENT }, { method: 'post' })}
    >
      {busy ? 'Opening Google…' : CONNECT_LABEL[kind]}
    </Button>
  )
}

/** The disconnect's request and its two announcements. */
function useDisconnect() {
  const act = useFetcher<ActionResult>()
  const settled = act.state === 'idle' ? act.data : undefined
  useSavedToast(settled?.ok === true, 'Google Calendar disconnected.')
  useFailureToast(settled?.ok === false ? settled.error : null)

  return {
    busy: act.state !== 'idle',
    run: () => act.submit({ intent: DISCONNECT_CALENDAR_INTENT }, { method: 'post' }),
  }
}

/**
 * Disconnecting, behind a confirmation: new meetings stop reaching anybody's
 * calendar until it is connected again, which is worth one more click.
 */
function DisconnectButton({ busy, onConfirm }: { busy: boolean; onConfirm: () => void }) {
  const confirm = useDisclosure()
  return (
    <>
      <Button
        variant="danger"
        size="sm"
        type="button"
        className="flex-1"
        onClick={confirm.onOpen}
        disabled={busy}
      >
        Disconnect
      </Button>
      <Modal
        open={confirm.open}
        onClose={confirm.onClose}
        title="Disconnect Google Calendar?"
        footer={
          <>
            <Button variant="soft" type="button" onClick={confirm.onClose}>
              Keep it connected
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={busy}
              onClick={() => {
                confirm.onClose()
                onConfirm()
              }}
            >
              Disconnect
            </Button>
          </>
        }
      >
        New and changed meetings won&rsquo;t be sent to Google Calendar until it&rsquo;s connected
        again. Meetings already on people&rsquo;s calendars stay there.
      </Modal>
    </>
  )
}
