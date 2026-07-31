import { USER_SELECTION_DIALOG_SIZE } from '@webonone/ui-kit'

export const USER_SELECT_EMBED_PATH = '/embed/dialogs/users/select'
export const USER_SELECT_DIALOG = USER_SELECTION_DIALOG_SIZE

export function createNestedRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `user-select-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
