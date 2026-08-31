import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useToast,
} from '@webonone/ui-kit'
import { useAiEntityPaste } from '@/features/ai/context/AiEntityPasteContext'

const AI_PRODUCT_VARIANTS_CHANGED_EVENT = 'webonone:platform:ai-product-variants-changed'

type CompanyProductVariantsAiMenuProps = {
  libraryEntityId: string
  entityName: string
}

export function CompanyProductVariantsAiMenu({
  libraryEntityId,
  entityName,
}: CompanyProductVariantsAiMenuProps) {
  const { t } = useTranslation('catalog')
  const { toast } = useToast()
  const { requestEntityPaste } = useAiEntityPaste()

  function handleSuggestVariants() {
    requestEntityPaste({
      entities: [
        {
          service: 'data',
          kind: 'product',
          id: libraryEntityId,
          label: entityName,
        },
      ],
      composerText: t('variantsTab.aiSuggestVariantsPrompt', { productName: entityName }),
    })
    toast({ title: t('variantsTab.aiSuggestVariantsSuccess') })
  }

  function handleCopyToAi() {
    requestEntityPaste({
      entities: [
        {
          service: 'data',
          kind: 'product',
          id: libraryEntityId,
          label: entityName,
        },
      ],
    })
    toast({ title: t('attributesTab.copyToAiSuccess') })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-9">
          <Sparkles className="h-4 w-4" aria-hidden />
          {t('variantsTab.aiSuggestVariants')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleSuggestVariants}>
          {t('variantsTab.aiSuggestVariants')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyToAi}>
          {t('attributesTab.copyToAi')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AI_PRODUCT_VARIANTS_CHANGED_EVENT }
