import { Pressable } from 'react-native'
import {
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  StatusTag,
} from '@webonone/mobile-ui'
import {
  formatTemplateDateTime,
  formatTemplateScope,
} from '@/features/email/utils/formatTemplateMeta'
import type { EmailAdminTemplate } from '@/shared/services/emailAdminApi'

interface TemplatesListProps {
  templates: EmailAdminTemplate[]
  busyId: string | null
  onOpen: (template: EmailAdminTemplate) => void
  onEdit: (template: EmailAdminTemplate) => void
  onPreview: (template: EmailAdminTemplate) => void
  onToggleActive: (template: EmailAdminTemplate) => void
  onVersions: (template: EmailAdminTemplate) => void
  emptyMessage?: string
}

export function TemplatesList({
  templates,
  busyId,
  onOpen,
  onEdit,
  onPreview,
  onToggleActive,
  onVersions,
  emptyMessage = 'No templates in this scope.',
}: TemplatesListProps) {
  if (templates.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <ItemList>
      {templates.map((template) => {
        const isBusy = busyId === template.id
        const isDefault = Boolean(template.isDefault)

        return (
          <ItemListItem key={template.id}>
            <Pressable
              className="min-w-0 flex-1"
              onPress={() => onOpen(template)}
              accessibilityRole="button"
            >
              <ItemListContent
                title={template.name}
                subtitle={`${template.slug} · ${formatTemplateScope(template)} · ${
                  template.isActive ? 'Active' : 'Inactive'
                } · ${formatTemplateDateTime(template.updatedAt)}`}
              />
            </Pressable>
            <StatusTag variant={template.isActive ? 'approved' : 'rejected'}>
              {template.isActive ? 'Active' : 'Inactive'}
            </StatusTag>
            <ItemListMenu ariaLabel={`Actions — ${template.name}`}>
              <ItemListMenuItem disabled={isBusy} onPress={() => onOpen(template)}>
                View details
              </ItemListMenuItem>
              <ItemListMenuItem disabled={isBusy} onPress={() => onEdit(template)}>
                {isDefault ? 'Customize' : 'Edit'}
              </ItemListMenuItem>
              <ItemListMenuItem disabled={isBusy} onPress={() => onPreview(template)}>
                Preview
              </ItemListMenuItem>
              {!isDefault ? (
                <ItemListMenuItem disabled={isBusy} onPress={() => onToggleActive(template)}>
                  {template.isActive ? 'Deactivate' : 'Activate'}
                </ItemListMenuItem>
              ) : null}
              {!isDefault ? (
                <ItemListMenuItem disabled={isBusy} onPress={() => onVersions(template)}>
                  Version history
                </ItemListMenuItem>
              ) : null}
            </ItemListMenu>
          </ItemListItem>
        )
      })}
    </ItemList>
  )
}
