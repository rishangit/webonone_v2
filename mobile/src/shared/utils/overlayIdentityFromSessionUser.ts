export type SessionIdentityProfile = {
  id: string
  displayName: string
  avatarUrl?: string | null
  email?: string | null
}

function sessionOverlay(sessionUser: SessionIdentityProfile) {
  return {
    displayName: sessionUser.displayName.trim(),
    avatarUrl: sessionUser.avatarUrl ?? null,
    email: sessionUser.email?.trim() || null,
  }
}

export function overlayEventAttendeeFromSessionUser<
  T extends {
    attendeeUserId?: string | null
    attendeeDisplayName?: string | null
    attendeeEmail?: string | null
    attendeeImageUrl?: string | null
  },
>(item: T, sessionUser: SessionIdentityProfile | null | undefined): T {
  if (!sessionUser || item.attendeeUserId !== sessionUser.id) return item
  const overlay = sessionOverlay(sessionUser)
  return {
    ...item,
    attendeeDisplayName: overlay.displayName || item.attendeeDisplayName,
    attendeeEmail: overlay.email ?? item.attendeeEmail,
    attendeeImageUrl: overlay.avatarUrl ?? item.attendeeImageUrl,
  }
}

export function overlayNamedUserFromSessionUser<
  T extends {
    userId?: string | null
    userDisplayName: string
    userEmail?: string | null
    userAvatarUrl?: string | null
  },
>(item: T, sessionUser: SessionIdentityProfile | null | undefined): T {
  if (!sessionUser || item.userId !== sessionUser.id) return item
  const overlay = sessionOverlay(sessionUser)
  return {
    ...item,
    userDisplayName: overlay.displayName || item.userDisplayName,
    userEmail: overlay.email ?? item.userEmail,
    userAvatarUrl: overlay.avatarUrl ?? item.userAvatarUrl,
  }
}

export function overlayStaffFromSessionUser<
  T extends {
    userId: string
    displayName: string
    email?: string | null
    avatarUrl?: string | null
  },
>(item: T, sessionUser: SessionIdentityProfile | null | undefined): T {
  if (!sessionUser || item.userId !== sessionUser.id) return item
  const overlay = sessionOverlay(sessionUser)
  return {
    ...item,
    displayName: overlay.displayName || item.displayName,
    email: overlay.email ?? item.email,
    avatarUrl: overlay.avatarUrl ?? item.avatarUrl,
  }
}

export function overlaySaleCustomerFromSessionUser<
  T extends {
    customerUserId: string
    customerDisplayName: string
    customerEmail?: string | null
    customerAvatarUrl?: string | null
  },
>(item: T, sessionUser: SessionIdentityProfile | null | undefined): T {
  if (!sessionUser || item.customerUserId !== sessionUser.id) return item
  const overlay = sessionOverlay(sessionUser)
  return {
    ...item,
    customerDisplayName: overlay.displayName || item.customerDisplayName,
    customerEmail: overlay.email ?? item.customerEmail,
    customerAvatarUrl: overlay.avatarUrl ?? item.customerAvatarUrl,
  }
}

export function overlayStockSupplierFromSessionUser<
  T extends {
    supplierUserId: string | null
    supplierDisplayName: string | null
    supplierEmail?: string | null
  },
>(item: T, sessionUser: SessionIdentityProfile | null | undefined): T {
  if (!sessionUser || item.supplierUserId !== sessionUser.id) return item
  const overlay = sessionOverlay(sessionUser)
  return {
    ...item,
    supplierDisplayName: overlay.displayName || item.supplierDisplayName,
    supplierEmail: overlay.email ?? item.supplierEmail,
  }
}
