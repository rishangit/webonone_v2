import { StatusTag, type StatusTagVariant } from '@webonone/ui-kit'

/** Maps Data API `status` (`verified` | `pending`) to UI Kit verification tags. */
function toVerificationVariant(status: string): StatusTagVariant {
  return status === 'verified' ? 'verified' : 'unverified'
}

export function StatusBadge({ status }: { status: string }) {
  return <StatusTag variant={toVerificationVariant(status)} />
}
