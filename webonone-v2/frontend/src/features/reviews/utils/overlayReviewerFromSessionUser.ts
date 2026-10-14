import {
  overlayIdentityFromSessionUser,
  type SessionIdentityProfile,
} from '@/shared/utils/overlayIdentityFromSessionUser'

export type SessionReviewerProfile = SessionIdentityProfile

export function overlayReviewerFromSessionUser<
  T extends {
    userId?: string
    reviewerDisplayName: string
    reviewerAvatarUrl: string | null
  },
>(item: T, sessionUser: SessionReviewerProfile | null | undefined): T {
  return overlayIdentityFromSessionUser(item, sessionUser, {
    userId: 'userId',
    displayName: 'reviewerDisplayName',
    avatarUrl: 'reviewerAvatarUrl',
  })
}
