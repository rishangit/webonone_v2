export type SessionReviewerProfile = {
  id: string
  displayName: string
  avatarUrl?: string | null
}

export function overlayReviewerFromSessionUser<
  T extends {
    userId?: string
    reviewerDisplayName: string
    reviewerAvatarUrl: string | null
  },
>(item: T, sessionUser: SessionReviewerProfile | null | undefined): T {
  if (!sessionUser || item.userId !== sessionUser.id) return item
  const displayName = sessionUser.displayName.trim()
  return {
    ...item,
    reviewerDisplayName: displayName || item.reviewerDisplayName,
    reviewerAvatarUrl: sessionUser.avatarUrl ?? item.reviewerAvatarUrl,
  }
}
