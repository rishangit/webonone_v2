import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { useNavigateSms } from '@/features/shell/utils/navigateSms'
import type { SmsTemplate } from '@/shared/types/sms.types'

interface TemplatesListProps {
  templates: SmsTemplate[]
  onEdit: (template: SmsTemplate) => void
  onToggleActive: (template: SmsTemplate) => void
  onDelete: (template: SmsTemplate) => void
  busyId: string | null
  canDelete: boolean
}

function formatScope(template: SmsTemplate): string {
  if (template.isDefault) return 'Default'
  return template.scope === 'platform' ? 'Platform' : 'Company'
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
  const { goToDetail, goToPreview, goToVersions } = useNavigateSms()
  const items = Array.isArray(templates) ? templates : []

  if (items.length === 0) {
    return <ItemListEmpty>No templates found for your scope.</ItemListEmpty>
  }

  return (
    <ItemList>
      {items.map((template) => {
        const isBusy = busyId === template.id
        const isDefault = Boolean(template.isDefault)

        return (
          <ItemListItem key={template.id}>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => goToDetail(template.id)}
              >
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.slug} · {formatScope(template)} ·{' '}
                  {template.isActive ? 'Active' : 'Inactive'} · Updated{' '}
                  {formatDate(template.updatedAt)}
                </p>
              </button>
            </ItemListContent>
            <ItemListMenu ariaLabel={`Actions for ${template.name}`}>
              <DropdownMenuItem onClick={() => goToDetail(template.id)} disabled={isBusy}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)} disabled={isBusy}>
                {isDefault ? 'Customize' : 'Edit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => goToPreview(template.id)} disabled={isBusy}>
                Preview
              </DropdownMenuItem>
              {!isDefault ? (
                <DropdownMenuItem onClick={() => onToggleActive(template)} disabled={isBusy}>
                  {template.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
              ) : null}
              {!isDefault ? (
                <DropdownMenuItem onClick={() => goToVersions(template.id)} disabled={isBusy}>
                  Version history
                </DropdownMenuItem>
              ) : null}
              {canDelete && template.scope === 'company' && !isDefault ? (
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
