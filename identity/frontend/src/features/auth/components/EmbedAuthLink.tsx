import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useEmbedAuthNavigate } from '../hooks/useEmbedAuthNavigate'

type EmbedAuthLinkProps = {
  to: string
  className?: string
  children: ReactNode
}

export function EmbedAuthLink({ to, className, children }: EmbedAuthLinkProps) {
  const { navigateAuth, isEmbed } = useEmbedAuthNavigate()

  if (isEmbed) {
    return (
      <button
        type="button"
        className={`inline cursor-pointer border-0 bg-transparent p-0 font-inherit ${className ?? ''}`}
        onClick={() => {
          navigateAuth(to)
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}
