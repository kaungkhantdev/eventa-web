import { meAccountApi } from '@/lib/api'
import type {
  AttendeeNotificationCategory,
  NotificationPreferencePatch,
} from './accountSettings.types'

/**
 * Every call the portal's Settings tab makes, and nothing else (US-DISC-12).
 *
 * Only the notification preferences are here. The display preferences ride on
 * `/me/profile`, which `profile.api.ts` already owns — a second client for the
 * same record is a second place for it to drift.
 */
export const accountSettingsApi = {
  /** Every topic this persona may set, with the API's defaults filled in. */
  notifications: () => meAccountApi.notifications<AttendeeNotificationCategory>(),

  /**
   * One topic at a time, which is how the API takes it: a partial patch per
   * category, so a switch sends the channel it owns and leaves the other
   * alone. The answer is the whole list again; it is ignored, because the
   * loader revalidates and there is no second copy of it to update.
   */
  setNotification: (
    category: AttendeeNotificationCategory,
    body: NotificationPreferencePatch,
  ) => meAccountApi.setNotification(category, body),
}
