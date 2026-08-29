import * as React from 'react'
import { ChevronDown, User } from 'lucide-react'
import { cn } from '../lib/utils'
import { Avatar } from './Avatar'
import { AvatarGroup } from './AvatarGroup'

export interface SelectUserValue {
  id: string
  displayName: string
  email: string
  avatarUrl?: string | null
}

export interface SelectUserProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selectedUser?: SelectUserValue | null
  selectedUsers?: SelectUserValue[]
  multiple?: boolean
  placeholder?: string
  /** Max avatars in the group stack before +N (default 4). */
  maxVisibleUsers?: number
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return (name.slice(0, 2) || '?').toUpperCase()
}

function toAvatarGroupUser(user: SelectUserValue) {
  return {
    src: user.avatarUrl,
    fallback: getInitials(user.displayName),
    alt: `${user.displayName}-${user.id}`,
    name: user.displayName,
  }
}

const triggerClassName =
  'ui-shape-control flex w-full items-center gap-3 border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

function SelectUser({
  selectedUser,
  selectedUsers = [],
  multiple = false,
  placeholder = 'Select user',
  maxVisibleUsers = 4,
  className,
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
  onClick,
  onKeyDown,
  ...props
}: SelectUserProps) {
  const users = multiple ? selectedUsers : selectedUser ? [selectedUser] : []
  const hasSelection = users.length > 0

  const resolvedAriaLabel =
    ariaLabel ??
    (multiple
      ? hasSelection
        ? `${users.length} users selected`
        : placeholder
      : selectedUser
        ? `Selected user ${selectedUser.displayName}`
        : placeholder)

  const content = hasSelection ? (
    multiple ? (
      <>
        <AvatarGroup users={users.map(toAvatarGroupUser)} size="sm" max={maxVisibleUsers} />
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {users.length === 1 ? users[0]!.displayName : `${users.length} users selected`}
        </span>
      </>
    ) : (
      <>
        <Avatar
          size="sm"
          src={selectedUser!.avatarUrl}
          alt={selectedUser!.displayName}
          fallback={getInitials(selectedUser!.displayName)}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{selectedUser!.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{selectedUser!.email}</p>
        </div>
      </>
    )
  ) : (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <User className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{placeholder}</span>
    </>
  )

  const chevron = <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />

  if (multiple && hasSelection) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={resolvedAriaLabel}
        className={cn(triggerClassName, className)}
        onClick={
          disabled
            ? undefined
            : (event) => onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
        }
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
          }
          onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLButtonElement>)
        }}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        {content}
        {chevron}
      </div>
    )
  }

  return (
    <button
      type={type}
      className={cn(triggerClassName, className)}
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...props}
    >
      {content}
      {chevron}
    </button>
  )
}

export { SelectUser }
