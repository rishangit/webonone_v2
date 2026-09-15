import { useTranslation } from 'react-i18next'
import type { WebononeAiEntityKind } from '@webonone/platform-embed'
import { Button, useToast } from '@webonone/ui-kit'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'

type WebononeCopyToAiButtonProps = {
  kind: WebononeAiEntityKind
  id: string
  label: string
}

export function WebononeCopyToAiButton({ kind, id, label }: WebononeCopyToAiButtonProps) {
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

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      {t('list.copyToAi')}
    </Button>
  )
}
