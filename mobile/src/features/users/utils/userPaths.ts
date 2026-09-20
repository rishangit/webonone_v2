import { IDENTITY_NAV_SENTINELS } from '@webonone/platform-nav'

export const USERS_LIST_PATH = IDENTITY_NAV_SENTINELS.users

export function userDetailPath(userId: string, tab?: 'overview' | 'history'): string {
  const base = `${IDENTITY_NAV_SENTINELS.users}/${userId}`
  return tab === 'history' ? `${base}?tab=history` : base
}

export function userHistoryTokenPath(userId: string, tokenId: string): string {
  return `${userDetailPath(userId)}/history/tokens/${tokenId}`
}

export function userHistorySalePath(userId: string, saleId: string): string {
  return `${userDetailPath(userId)}/history/sales/${saleId}`
}

export function userHistorySubmissionPath(userId: string, submissionId: string): string {
  return `${userDetailPath(userId)}/history/submissions/${submissionId}`
}
