import { useTranslation } from 'react-i18next'
import type { WebononeAiEntityKind } from '@webonone/platform-embed'
import { DropdownMenuItem, useToast } from '@webonone/ui-kit'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'

type WebononeCopyToAiMenuItemProps = {
  kind: WebononeAiEntityKind
  id: string
  label: string
}

export function WebononeCopyToAiMenuItem({ kind, id, label }: WebononeCopyToAiMenuItemProps) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  function handleClick() {
    requestEntityPaste({
      service: 'webonone',
      kind,
      id,
      label,
    })
    toast({ title: t('list.copyToAiSuccess') })
  }

  return <DropdownMenuItem onClick={handleClick}>{t('list.copyToAi')}</DropdownMenuItem>
}
