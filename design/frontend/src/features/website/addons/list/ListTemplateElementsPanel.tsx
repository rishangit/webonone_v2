import { useTranslation } from 'react-i18next'
import { Box, Puzzle } from 'lucide-react'
import { Button } from '@webonone/ui-kit'
import type { ListTemplateElement } from '../../document/listTemplateElements'
import type { TemplateHostEditorContext } from '../types'

export function ListTemplateElementsPanel({
  elements,
  templateHostEditor,
  onEditElement,
}: {
  elements: ListTemplateElement[]
  templateHostEditor?: TemplateHostEditorContext | null
  onEditElement?: () => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')

  if (elements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('listTemplateElementsEmpty')}</p>
    )
  }

  return (
    <ul className="space-y-2">
      {elements.map((element) => {
        const key =
          element.kind === 'block'
            ? `block:${element.templateBlockId}`
            : `addon:${element.templateBlockId}:${element.templateAddonId}`
        const Icon = element.kind === 'block' ? Box : Puzzle
        return (
          <li
            key={key}
            className="flex items-center gap-2 rounded-md border border-[hsl(var(--glass-border))] px-3 py-2"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm">{element.label}</span>
            <Button
              type="button"
              variant="outline"
              className="h-8 shrink-0 px-3"
              disabled={!templateHostEditor}
              onClick={() => {
                if (!templateHostEditor) return
                onEditElement?.()
                if (element.kind === 'block') {
                  templateHostEditor.onOpenTemplateBlockSettings(element.templateBlockId)
                } else {
                  templateHostEditor.onOpenTemplateAddonSettings(
                    element.templateBlockId,
                    element.templateAddonId,
                    templateHostEditor.listManualItemId ?? undefined,
                  )
                }
              }}
            >
              {tc('edit')}
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
