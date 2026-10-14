export type SessionIdentityProfile = {
  id: string
  displayName: string
  email?: string | null
  avatarUrl?: string | null
}

export function overlayIdentityFromSessionUser<T>(
  item: T,
  sessionUser: SessionIdentityProfile | null | undefined,
  keys: {
    userId: keyof T
    displayName?: keyof T
    email?: keyof T
    avatarUrl?: keyof T
  },
): T {
  if (!sessionUser) return item
  const userId = item[keys.userId]
  if (userId !== sessionUser.id) return item
  const displayName = sessionUser.displayName.trim()
  return {
    ...item,
    ...(keys.displayName
      ? { [keys.displayName]: displayName || item[keys.displayName] }
      : {}),
    ...(keys.email ? { [keys.email]: sessionUser.email ?? item[keys.email] } : {}),
    ...(keys.avatarUrl
      ? { [keys.avatarUrl]: sessionUser.avatarUrl ?? item[keys.avatarUrl] }
      : {}),
  }
}
