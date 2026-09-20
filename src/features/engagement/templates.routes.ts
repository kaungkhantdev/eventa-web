import { pageAction, pageData, type LoaderArgs } from '@/app/loaders'
import { api } from '@/lib/api'
import { toTemplateCard, type TemplateCard } from './templates.mapper'
import type { MessageTemplateWire } from './templates.types'

/** The automated messages a workspace sends (US-MSG-01). */

const templatesApi = {
  list: () => api.get<MessageTemplateWire[]>('/message-templates'),
  setActive: (slug: string, active: boolean) =>
    api.patch<MessageTemplateWire[]>(`/message-templates/${slug}`, { active }),
  setWording: (slug: string, wording: unknown) =>
    api.patch<MessageTemplateWire[]>(
      `/message-templates/${slug}/wording`,
      wording,
    ),
}

export interface TemplatesData {
  cards: TemplateCard[]
  /** How many are switched on AND actually being sent, for the page's summary. */
  sending: number
}

async function loadTemplates(): Promise<TemplatesData> {
  const cards = (await templatesApi.list()).map(toTemplateCard)
  return {
    cards,
    // A message that is switched on but that nothing sends is not "sending".
    sending: cards.filter((card) => card.active && card.standing === null)
      .length,
  }
}

/**
 * Switching one message.
 *
 * Nothing is returned for the page to hold: the loader revalidates after an
 * action, so the cards come back from the API. A refused switch surfaces as the
 * API's own sentence through `pageAction`.
 */
async function runTemplatesAction({ request }: LoaderArgs): Promise<null> {
  const form = await request.formData()
  const slug = String(form.get('slug') ?? '')

  if (String(form.get('intent') ?? '') === 'wording') {
    // Sent as written, including the blanks: an emptied field is how an
    // organizer asks for Eventa's own copy back, so it has to reach the API
    // rather than being dropped as "nothing changed".
    await templatesApi.setWording(slug, {
      en: {
        subject: String(form.get('subjectEn') ?? ''),
        body: String(form.get('bodyEn') ?? ''),
      },
      th: {
        subject: String(form.get('subjectTh') ?? ''),
        body: String(form.get('bodyTh') ?? ''),
      },
    })
    return null
  }

  await templatesApi.setActive(slug, form.get('active') === 'true')
  return null
}

export const messageTemplatesRoute = {
  loader: pageData(loadTemplates),
  action: pageAction(runTemplatesAction),
}
