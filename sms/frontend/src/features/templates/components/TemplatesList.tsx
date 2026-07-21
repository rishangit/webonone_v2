import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import type { SmsTemplate } from '@/shared/types/sms.types'

interface TemplatesListProps {
  templates: SmsTemplate[]
  onEdit: (template: SmsTemplate) => void
  onToggleActive: (template: SmsTemplate) => void
  onDelete: (template: SmsTemplate) => void
  busyId: string | null
  canDelete: boolean
}

function formatScope(scope: SmsTemplate['scope']): string {
  return scope === 'platform' ? 'Platform' : 'Company'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function TemplatesList({
  templates,
  onEdit,
  onToggleActive,
  onDelete,
  busyId,
  canDelete,
}: TemplatesListProps) {
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
                {template.isActive ? 'Active' : 'Inactive'} · Updated{' '}
                {formatDate(template.updatedAt)}
              </p>
            </ItemListContent>
            <ItemListMenu ariaLabel={`Actions for ${template.name}`}>
              <DropdownMenuItem onClick={() => onEdit(template)} disabled={isBusy}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/templates/${template.id}`)}
                disabled={isBusy}
              >
                Version history
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(template)} disabled={isBusy}>
                {template.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              {canDelete && template.scope === 'company' ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(template)}
                    disabled={isBusy}
                  >
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
