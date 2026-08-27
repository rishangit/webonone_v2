import { ImagePreview } from '@webonone/ui-kit'

type SessionTokenUserIdentityProps = {
  displayName: string
  email?: string | null
  avatarUrl?: string | null
  size?: 'list' | 'hero'
  noEmailLabel?: string
}

export function SessionTokenUserIdentity({
  displayName,
  email,
  avatarUrl,
  size = 'list',
  noEmailLabel,
}: SessionTokenUserIdentityProps) {
  const avatarClassName = size === 'hero' ? 'h-12 w-12 rounded-md' : 'h-10 w-10 rounded-md'

  return (
    <div className="flex min-w-0 items-center gap-3">
      <ImagePreview
        src={avatarUrl ?? null}
        alt={displayName}
        mode="view"
        className={avatarClassName}
      />
      <div className="min-w-0 flex-1">
        <p
          className={
            size === 'hero'
              ? 'truncate text-sm font-medium text-foreground'
              : 'truncate text-sm text-muted-foreground'
          }
        >
          {displayName}
        </p>
        {email !== undefined ? (
          <p className="truncate text-sm text-muted-foreground">
            {email ?? noEmailLabel ?? '—'}
          </p>
        ) : null}
      </div>
    </div>
  )
}
