import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { interactiveHoverClassName } from '../lib/selectionStyles'
import { cn } from '../lib/utils'
import { Avatar } from './Avatar'
import { avatarVariants } from './avatar-variants'
import { Popover, PopoverAnchor, PopoverContent } from './Popover'

export interface AvatarGroupUser {
  src?: string | null
  fallback: string
  alt: string
  name?: string
}

export interface AvatarGroupProps extends VariantProps<typeof avatarVariants> {
  users: AvatarGroupUser[]
  /** Max faces in the stack before showing +N (default 4). */
  max?: number
  className?: string
}

function AvatarOverflowBadge({
  count,
  size,
  className,
  style,
}: {
  count: number
  size: AvatarGroupProps['size']
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn(
        avatarVariants({ size }),
        'flex items-center justify-center bg-muted text-xs font-medium text-muted-foreground',
        className,
      )}
      style={style}
      aria-hidden
    >
      +{count}
    </div>
  )
}

function AvatarGroup({ users, max = 4, size = 'md', className }: AvatarGroupProps) {
  const [open, setOpen] = React.useState(false)
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const overflowCount = users.length > max ? users.length - (max - 1) : 0
  const visibleUsers = overflowCount > 0 ? users.slice(0, max - 1) : users.slice(0, max)

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function handleOpen() {
    clearCloseTimer()
    setOpen(true)
  }

  function handleClose() {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  React.useEffect(() => () => clearCloseTimer(), [])

  if (users.length === 0) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn('inline-flex items-center', className)}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onFocus={handleOpen}
          onBlur={handleClose}
        >
          {visibleUsers.map((user, index) => (
            <Avatar
              key={user.alt}
              size={size}
              src={user.src}
              alt={user.alt}
              fallback={user.fallback}
              className={cn(
                'ring-1 ring-background transition-transform hover:z-10 hover:scale-105',
                index > 0 && '-ml-2.5',
              )}
              style={{ zIndex: index }}
            />
          ))}
          {overflowCount > 0 ? (
            <AvatarOverflowBadge
              count={overflowCount}
              size={size}
              className="-ml-2.5 ring-1 ring-background"
              style={{ zIndex: visibleUsers.length }}
            />
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-56 p-2"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {users.map((user) => (
            <li
              key={user.alt}
              className={cn('flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm', interactiveHoverClassName)}
            >
              <Avatar size="sm" src={user.src} alt={user.alt} fallback={user.fallback} />
              <span className="truncate">{user.name ?? user.alt}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export { AvatarGroup }
