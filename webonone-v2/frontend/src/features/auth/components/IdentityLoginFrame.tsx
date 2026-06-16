import { useIdentityAuthMessage } from '../hooks/useIdentityAuthMessage'

interface IdentityLoginFrameProps {
  loginUrl: string
  parentOrigin: string
  returnPath?: string
}

export function IdentityLoginFrame({
  loginUrl,
  parentOrigin,
  returnPath = '/',
}: IdentityLoginFrameProps) {
  useIdentityAuthMessage(returnPath)

  const params = new URLSearchParams({
    parentOrigin,
    returnPath,
  })
  const src = `${loginUrl}?${params.toString()}`

  return (
    <iframe
      title="Sign in"
      src={src}
      className="h-[520px] w-full max-w-md rounded-lg border bg-background"
    />
  )
}
