import { useState } from 'react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  StatusTag,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { FormTemplate } from '@/shared/types/design.types'

interface FormsListProps {
  forms: FormTemplate[]
  onOpen: (form: FormTemplate) => void
  onDeleted: (id: string) => void
  canManage: boolean
}

export function FormsList({ forms, onOpen, onDeleted, canManage }: FormsListProps) {
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)

  if (forms.length === 0) {
    return <ItemListEmpty>No forms yet. Create one to start designing.</ItemListEmpty>
  }

  return (
    <>
      <ItemList>
        {forms.map((form) => (
          <ItemListItem key={form.id}>
            <ItemListContent>
              <button
                type="button"
                className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onOpen(form)}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{form.name}</p>
                  <StatusTag variant={form.status === 'published' ? 'approved' : 'pending'}>
                    {form.status}
                  </StatusTag>
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.slug} · {form.definition.fields.length} field
                  {form.definition.fields.length === 1 ? '' : 's'}
                </p>
              </button>
            </ItemListContent>
            {canManage ? (
              <ItemListMenu ariaLabel={`Actions for ${form.name}`}>
                <DropdownMenuItem onClick={() => onOpen(form)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setPendingDelete({ id: form.id, name: form.name })}
                >
                  Delete
                </DropdownMenuItem>
              </ItemListMenu>
            ) : null}
          </ItemListItem>
        ))}
      </ItemList>
      <PlatformAlertConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete form?'}
        description="This action cannot be undone. The form will be permanently removed."
        isAllowedParentOrigin={isAllowedParentOrigin}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) onDeleted(pendingDelete.id)
        }}
      />
    </>
  )
}
