export function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'verified'
      ? 'inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
      : 'inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
  const label = status === 'verified' ? 'Verified' : 'Pending'
  return <span className={className}>{label}</span>
}
