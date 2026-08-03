import { CheckSquare, ChevronDown, CircleDot, Type, AlignLeft } from 'lucide-react'
import { Button } from '@webonone/ui-kit'
import type { FormFieldType } from '@/shared/types/design.types'

const TOOLS: { type: FormFieldType; label: string; icon: typeof Type }[] = [
  { type: 'text', label: 'Text box', icon: Type },
  { type: 'textarea', label: 'Text area', icon: AlignLeft },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio', icon: CircleDot },
  { type: 'select', label: 'Dropdown', icon: ChevronDown },
]

interface FormDesignerToolboxProps {
  onAdd: (type: FormFieldType) => void
  disabled?: boolean
}

export function FormDesignerToolbox({ onAdd, disabled }: FormDesignerToolboxProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Toolbox</p>
      <p className="text-xs text-muted-foreground">Click to add a field to the form.</p>
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
              {tool.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
