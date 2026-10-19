import { useTranslation } from 'react-i18next'
import { DropdownMenuItem, useToast } from '@webonone/ui-kit'

type CopyCanvasElementToAiMenuItemProps = {
  onCopy: () => void
}

export function CopyCanvasElementToAiMenuItem({ onCopy }: CopyCanvasElementToAiMenuItemProps) {
  const { t } = useTranslation('shell')
  const { toast } = useToast()

  return (
    <DropdownMenuItem
      onClick={() => {
        onCopy()
        toast({ title: t('copyToAiSuccess') })
      }}
    >
      {t('copyToAi')}
    </DropdownMenuItem>
  )
}
