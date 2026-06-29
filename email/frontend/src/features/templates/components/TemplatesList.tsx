import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { EmailTemplate } from '@/shared/types/email.types'

interface TemplatesListProps {
  templates: EmailTemplate[]
  onToggleActive: (template: EmailTemplate) => void
  busyId: string | null
}

function formatScope(scope: EmailTemplate['scope']): string {
  return scope === 'platform' ? 'Platform' : 'Company'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function TemplatesList({ templates, onToggleActive, busyId }: TemplatesListProps) {
  const navigate = useNavigate()
  const items = Array.isArray(templates) ? templates : []

  if (items.length === 0) {
    return <ItemListEmpty>No templates found for your scope.</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((template) => {
        const isBusy = busyId === template.id

        return (
          <ItemListItem key={template.id}>
            <ItemListContent>
              <p className="font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.slug} · {formatScope(template.scope)} ·{' '}
                {template.isActive ? 'Active' : 'Inactive'} · Updated {formatDate(template.updatedAt)}
              </p>
            </ItemListContent>
            <ItemListMenu ariaLabel={`Actions for ${template.name}`}>
              <DropdownMenuItem onClick={() => navigate(`/templates/${template.id}`)} disabled={isBusy}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/templates/${template.id}/preview`)}
                disabled={isBusy}
              >
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(template)} disabled={isBusy}>
                {template.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/templates/${template.id}`)} disabled={isBusy}>
                Version history
              </DropdownMenuItem>
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
