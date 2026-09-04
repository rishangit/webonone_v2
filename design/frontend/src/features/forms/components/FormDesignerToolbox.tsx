import { useState, type MouseEvent } from 'react'
import { CheckSquare, ChevronDown, CircleDot, Type, AlignLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, cn } from '@webonone/ui-kit'
import type { FormFieldType } from '@/shared/types/design.types'

const TOOLS: { type: FormFieldType; labelKey: string; icon: typeof Type }[] = [
  { type: 'text', labelKey: 'toolText', icon: Type },
  { type: 'textarea', labelKey: 'toolTextarea', icon: AlignLeft },
  { type: 'checkbox', labelKey: 'toolCheckbox', icon: CheckSquare },
  { type: 'radio', labelKey: 'toolRadio', icon: CircleDot },
  { type: 'select', labelKey: 'toolSelect', icon: ChevronDown },
]

const TOOL_ICON_CLASS = 'h-4 w-4 shrink-0'

interface FormDesignerToolboxProps {
  onAdd: (type: FormFieldType) => void
  disabled?: boolean
}

export function FormDesignerToolbox({ onAdd, disabled }: FormDesignerToolboxProps) {
  const { t } = useTranslation('forms')
  const [expandedType, setExpandedType] = useState<FormFieldType | null>(null)

  function handleMobileToolClick(event: MouseEvent<HTMLButtonElement>, type: FormFieldType) {
    if (disabled) return

    if (expandedType !== type) {
      event.preventDefault()
      setExpandedType(type)
      return
    }

    onAdd(type)
    setExpandedType(null)
  }

  return (
    <>
      <div className="hidden space-y-2 lg:block">
        <p className="text-sm font-medium">{t('toolbox')}</p>
        <p className="text-xs text-muted-foreground">{t('toolboxHint')}</p>
        <div className="flex flex-col gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon
            const label = t(tool.labelKey)
            return (
              <Button
                key={tool.type}
                type="button"
                variant="outline"
                className="h-9 w-full justify-start gap-2 px-3"
                disabled={disabled}
                onClick={() => onAdd(tool.type)}
              >
                <Icon className={TOOL_ICON_CLASS} aria-hidden />
                <span className="truncate">{label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-row flex-wrap items-center gap-2 lg:hidden">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          const label = t(tool.labelKey)
          const expanded = expandedType === tool.type

          return (
            <Button
              key={tool.type}
              type="button"
              variant="outline"
              size={expanded ? 'sm' : 'icon'}
              disabled={disabled}
              aria-label={label}
              aria-expanded={expanded}
              className={cn(
                'shrink-0 overflow-hidden',
                expanded
                  ? 'max-w-full justify-start gap-1.5 rounded-full px-3 transition-[max-width] duration-300 ease-out'
                  : 'h-9 w-9 justify-center rounded-full p-0',
              )}
              onClick={(event) => handleMobileToolClick(event, tool.type)}
            >
              <Icon className={TOOL_ICON_CLASS} aria-hidden />
              {expanded ? <span className="truncate whitespace-nowrap">{label}</span> : null}
            </Button>
          )
        })}
      </div>
    </>
  )
}
