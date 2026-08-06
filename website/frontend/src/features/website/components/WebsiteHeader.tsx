import { LogOut } from 'lucide-react'
import {
  Avatar,
  BrandLogo,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@webonone/ui-kit'
import { useWebsiteAuth } from '@/features/auth/context/WebsiteAuthContext'
import { getWebOnOneAppUrl, getWebOnOneLoginUrl } from '@/features/webonone/utils/webononeConfig'

type WebsiteHeaderProps = {
  className?: string
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

export function WebsiteHeader({ className }: WebsiteHeaderProps) {
  const { user, isAuthenticated, logout } = useWebsiteAuth()

  return (
    <header
      className={`flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8 ${className ?? ''}`}
    >
      <a href="/" className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandLogo>WebOnOne</BrandLogo>
      </a>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" asChild>
          <a href={getWebOnOneAppUrl()}>Open app</a>
        </Button>
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="User menu"
              >
                <Avatar
                  size="sm"
                  src={user.avatarUrl}
                  alt={user.displayName}
                  fallback={getInitials(user.displayName)}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-lg">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  {user.email ? (
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button type="button" size="sm" asChild>
            <a href={getWebOnOneLoginUrl(`${window.location.pathname}${window.location.search}`)}>
              Login
            </a>
          </Button>
        )}
      </div>
    </header>
  )
}
