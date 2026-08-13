import { CheckSquare, ChevronDown, CircleDot, Type, AlignLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@webonone/ui-kit'
import type { FormFieldType } from '@/shared/types/design.types'

const TOOLS: { type: FormFieldType; labelKey: string; icon: typeof Type }[] = [
  { type: 'text', labelKey: 'toolText', icon: Type },
  { type: 'textarea', labelKey: 'toolTextarea', icon: AlignLeft },
  { type: 'checkbox', labelKey: 'toolCheckbox', icon: CheckSquare },
  { type: 'radio', labelKey: 'toolRadio', icon: CircleDot },
  { type: 'select', labelKey: 'toolSelect', icon: ChevronDown },
]

interface FormDesignerToolboxProps {
  onAdd: (type: FormFieldType) => void
  disabled?: boolean
}

export function FormDesignerToolbox({ onAdd, disabled }: FormDesignerToolboxProps) {
  const { t } = useTranslation('forms')

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t('toolbox')}</p>
      <p className="text-xs text-muted-foreground">{t('toolboxHint')}</p>
      <div className="flex flex-col gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Button
              key={tool.type}
              type="button"
              variant="outline"
              className="justify-start gap-2"
              disabled={disabled}
              onClick={() => onAdd(tool.type)}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t(tool.labelKey)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
