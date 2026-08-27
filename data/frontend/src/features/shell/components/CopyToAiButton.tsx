import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, useToast } from '@webonone/ui-kit'
import type { DataAiEntityKind } from '@webonone/platform-embed'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { copyEntityToAi } from '@/features/shell/utils/copyEntityToAi'

type CopyToAiButtonProps = {
  kind: DataAiEntityKind
  id: string
  label: string
}

export function CopyToAiButton({ kind, id, label }: CopyToAiButtonProps) {
  const { t } = useTranslation('shell')
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  if (!parentOrigin) {
    return null
  }

  function handleClick() {
    const ok = copyEntityToAi(searchParams, { service: 'data', kind, id, label })
    if (ok) {
      toast({ title: t('copyToAiSuccess') })
      return
    }
    toast({
      title: t('copyToAiUnavailable'),
      variant: 'destructive',
    })
  }

  return (
    <Button type="button" variant="outline" className="h-10" onClick={handleClick}>
      {t('copyToAi')}
    </Button>
  )
}
