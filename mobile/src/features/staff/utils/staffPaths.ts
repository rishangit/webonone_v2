export const STAFF_LIST_PATH = '/staff'

export type StaffDetailTab = 'overview' | 'history' | 'leaves'

export function staffDetailPath(staffId: string, tab?: StaffDetailTab): string {
  const base = `/staff/${staffId}`
  if (tab && tab !== 'overview') return `${base}?tab=${tab}`
  return base
}

export function staffHistoryTokenPath(staffId: string, tokenId: string): string {
  return `/staff/${staffId}/history/tokens/${tokenId}`
}

export function staffHistorySubmissionPath(staffId: string, submissionId: string): string {
  return `/staff/${staffId}/history/submissions/${submissionId}`
}