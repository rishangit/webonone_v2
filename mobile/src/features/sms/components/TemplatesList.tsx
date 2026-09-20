import { useState } from 'react'
import { Pressable } from 'react-native'
import {
  ConfirmDialog,
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
} from '@/features/sms/utils/formatTemplateMeta'
import type { SmsAdminTemplate } from '@/shared/services/smsAdminApi'

interface TemplatesListProps {
  templates: SmsAdminTemplate[]
  busyId: string | null
  canDelete: boolean
  onOpen: (template: SmsAdminTemplate) => void
  onEdit: (template: SmsAdminTemplate) => void
  onPreview: (template: SmsAdminTemplate) => void
  onToggleActive: (template: SmsAdminTemplate) => void
  onVersions: (template: SmsAdminTemplate) => void
  onDelete: (template: SmsAdminTemplate) => void
  emptyMessage?: string
}

export function TemplatesList({
  templates,
  busyId,
  canDelete,
  onOpen,
  onEdit,
  onPreview,
  onToggleActive,
  onVersions,
  onDelete,
  emptyMessage = 'No templates in this scope.',
}: TemplatesListProps) {
  const [pendingDelete, setPendingDelete] = useState<SmsAdminTemplate | null>(null)

  if (templates.length === 0) {
    return <ItemListEmpty>{emptyMessage}</ItemListEmpty>
  }

  return (
    <>
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
                {canDelete && template.scope === 'company' && !isDefault ? (
                  <ItemListMenuItem
                    disabled={isBusy}
                    destructive
                    onPress={() => setPendingDelete(template)}
                  >
                    Delete
                  </ItemListMenuItem>
                ) : null}
              </ItemListMenu>
            </ItemListItem>
          )
        })}
      </ItemList>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete template?'}
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        busy={pendingDelete !== null && busyId === pendingDelete.id}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </>
  )
}
