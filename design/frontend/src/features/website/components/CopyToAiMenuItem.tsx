import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DropdownMenuItem, useToast } from '@webonone/ui-kit'
import type { DesignAiEntityKind } from '@webonone/platform-embed'
import { resolvePlatformEmbedParentOrigin } from '@webonone/platform-embed'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { copyEntityToAi } from '@/features/shell/utils/copyEntityToAi'

type CopyToAiMenuItemProps = {
  kind: DesignAiEntityKind
  id: string
  label: string
}

export function CopyToAiMenuItem({ kind, id, label }: CopyToAiMenuItemProps) {
  const { t } = useTranslation('shell')
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const parentOrigin = resolvePlatformEmbedParentOrigin(searchParams, isAllowedParentOrigin)

  if (!parentOrigin) {
    return null
  }

  function handleClick() {
    const ok = copyEntityToAi(searchParams, { service: 'design', kind, id, label })
    if (ok) {
      toast({ title: t('copyToAiSuccess') })
      return
    }
    toast({
      title: t('copyToAiUnavailable'),
      variant: 'destructive',
    })
  }

  return <DropdownMenuItem onClick={handleClick}>{t('copyToAi')}</DropdownMenuItem>
}
