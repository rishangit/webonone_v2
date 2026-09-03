import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'

const markdownComponents: Components = {
  a({ href, children }) {
    if (href?.startsWith('/')) {
      return (
        <Link to={href} className="text-primary underline-offset-4 hover:underline">
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        className="text-primary underline-offset-4 hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    )
  },
  h1({ children }) {
    return <h1 className="mt-8 text-2xl font-semibold text-foreground first:mt-0">{children}</h1>
  },
  h2({ children }) {
    return <h2 className="mt-8 text-xl font-semibold text-foreground">{children}</h2>
  },
  h3({ children }) {
    return <h3 className="mt-6 text-lg font-medium text-foreground">{children}</h3>
  },
  p({ children }) {
    return <p className="mt-3 text-base leading-7 text-foreground">{children}</p>
  },
  ul({ children }) {
    return <ul className="mt-3 list-disc space-y-1 pl-5 text-foreground">{children}</ul>
  },
  ol({ children }) {
    return <ol className="mt-3 list-decimal space-y-1 pl-5 text-foreground">{children}</ol>
  },
  li({ children }) {
    return <li className="leading-7">{children}</li>
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>
  },
  code({ children }) {
    return (
      <code className="rounded bg-muted px-1 py-0.5 text-sm text-foreground">{children}</code>
    )
  },
  blockquote({ children }) {
    return (
      <blockquote className="mt-4 border-l-2 border-primary/40 pl-4 text-muted-foreground">
        {children}
      </blockquote>
    )
  },
}

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-3xl min-w-0 break-words">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </Markdown>
    </div>
  )
}
