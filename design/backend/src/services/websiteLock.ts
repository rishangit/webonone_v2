import { HttpError } from './httpError.js'

export function isLockedFlag(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1
}

export function assertWebsiteUnlocked(locked: number | boolean | null | undefined): void {
  if (isLockedFlag(locked)) {
    throw new HttpError(
      409,
      'Default items cannot be edited or deleted. Duplicate the item to make changes.',
      'WEBSITE_DEFAULT_LOCKED',
    )
  }
}
