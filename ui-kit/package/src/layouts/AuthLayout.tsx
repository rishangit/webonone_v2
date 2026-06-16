import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'

interface AuthLayoutProps {
  title: string
  description?: string
  children: ReactNode
  variant?: 'full' | 'minimal'
  footer?: ReactNode
  className?: string
}

function AuthLayout({
  title,
  description,
  children,
  variant = 'full',
  footer,
  className,
}: AuthLayoutProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn('flex min-h-0 w-full items-center justify-center p-4', className)}>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? <div className="px-6 pb-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4', className)}>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">WebOnOne Identity</h1>
        <p className="text-sm text-muted-foreground">Secure authentication</p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? <div className="px-6 pb-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </Card>
    </div>
  )
}

export { AuthLayout }
