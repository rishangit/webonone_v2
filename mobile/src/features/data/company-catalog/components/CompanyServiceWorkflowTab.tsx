import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Body,
  Button,
  Card,
  ConfirmDialog,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
  ItemListMenuItem,
  Muted,
  Subheading,
} from '@webonone/mobile-ui'
import { WorkflowItemFormDialog } from '@/features/data/company-catalog/components/WorkflowItemFormDialog'
import { hydrateLinkedCatalogItems } from '@/features/data/company-catalog/utils/hydrateLinkedCatalog'
import { designFormsApi } from '@/features/design/services/designFormsApi'
import { companyCatalogApi } from '@/features/data/services/companyCatalogApi'
import type { ServiceWorkflowItem } from '@/features/sales/types/catalog.types'

function workflowItemTitle(item: ServiceWorkflowItem, checkInLabel: string): string {
  if (item.kind === 'check_in') return checkInLabel
  return item.space?.name ?? checkInLabel
}

function toPutBody(items: ServiceWorkflowItem[]) {
  return items.map((item) => ({
    kind: item.kind ?? 'space',
    space_id: item.space?.id ?? null,
    staff_ids: item.staff.map((entry) => entry.id),
    form_ids: item.forms.map((entry) => entry.id),
    session_queue: Boolean(item.sessionQueue),
    add_items_enabled: Boolean(item.addItemsEnabled),
    add_items_from_library_enabled: Boolean(item.addItemsFromLibraryEnabled),
  }))
}

export function CompanyServiceWorkflowTab({
  serviceId,
  timeMode,
  canEdit,
}: {
  serviceId: string
  timeMode?: 'duration' | 'window'
  canEdit: boolean
}) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const [items, setItems] = useState<ServiceWorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ index: number | null } | null>(null)
  const [pendingRemove, setPendingRemove] = useState<ServiceWorkflowItem | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [workflow, spacesResult, formsResult] = await Promise.all([
        companyCatalogApi.listServiceWorkflow(serviceId),
        companyCatalogApi.list('spaces'),
        designFormsApi.listPublished().catch(() => ({ items: [] })),
      ])
      const spaces = await hydrateLinkedCatalogItems('spaces', spacesResult.items)
      const spaceNameById = new Map(spaces.map((space) => [space.id, space.displayName]))
      const formNameById = new Map(formsResult.items.map((form) => [form.id, form.name]))
      setItems(
        workflow.items.map((item) => ({
          ...item,
          kind: item.kind ?? 'space',
          space: item.space
            ? {
                id: item.space.id,
                name: spaceNameById.get(item.space.id) ?? item.space.name,
              }
            : null,
          forms: item.forms.map((form) => ({
            id: form.id,
            name: formNameById.get(form.id) ?? form.name ?? form.id,
          })),
          sessionQueue: Boolean(item.sessionQueue),
          addItemsEnabled: Boolean(item.addItemsEnabled),
          addItemsFromLibraryEnabled: Boolean(item.addItemsFromLibraryEnabled),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [serviceId, t])

  useEffect(() => {
    void load()
  }, [load])

  async function persist(next: ServiceWorkflowItem[]) {
    setBusy(true)
    try {
      const result = await companyCatalogApi.replaceServiceWorkflow(serviceId, toPutBody(next))
      const formNames = new Map(next.flatMap((item) => item.forms.map((form) => [form.id, form.name])))
      const spaceNames = new Map(
        next.flatMap((item) => (item.space ? [[item.space.id, item.space.name] as const] : [])),
      )
      setItems(
        result.items.map((item, index) => ({
          ...item,
          kind: item.kind ?? 'space',
          orderNumber: index + 1,
          space: item.space
            ? {
                id: item.space.id,
                name: spaceNames.get(item.space.id) ?? item.space.name,
              }
            : null,
          forms: item.forms.map((form) => ({
            id: form.id,
            name: formNames.get(form.id) ?? form.name ?? form.id,
          })),
          sessionQueue: Boolean(item.sessionQueue),
          addItemsEnabled: Boolean(item.addItemsEnabled),
          addItemsFromLibraryEnabled: Boolean(item.addItemsFromLibraryEnabled),
        })),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDialogSave(draft: ServiceWorkflowItem) {
    const next =
      dialog?.index == null
        ? [...items, draft]
        : items.map((item, index) => (index === dialog.index ? { ...draft, id: item.id } : item))
    await persist(next)
    setDialog(null)
  }

  const usedSpaceIds = items
    .filter((item) => item.space?.id)
    .map((item) => item.space!.id)

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Subheading>{t('workflowTab.title')}</Subheading>
          <Muted className="text-sm">{t('workflowTab.description')}</Muted>
        </View>
        {canEdit ? (
          <Button size="sm" onPress={() => setDialog({ index: null })} disabled={busy || loading}>
            {t('workflowTab.add')}
          </Button>
        ) : null}
      </View>
      {error ? <Body className="text-destructive">{error}</Body> : null}
      {loading ? (
        <ItemListEmpty>{t('workflowTab.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('workflowTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList className="py-0" nestedInCard>
          {items.map((item, index) => (
            <ItemListItem key={item.id}>
              <ItemListContent
                title={`${item.orderNumber}. ${workflowItemTitle(item, t('workflowTab.checkIn'))}`}
                subtitle={item.staff.map((s) => s.displayName).join(', ') || '—'}
              />
              {canEdit && item.kind !== 'check_in' ? (
                <ItemListMenu ariaLabel="Workflow actions">
                  <ItemListMenuItem onPress={() => setDialog({ index })}>Edit</ItemListMenuItem>
                  <ItemListMenuItem destructive onPress={() => setPendingRemove(item)}>
                    {tc('remove')}
                  </ItemListMenuItem>
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}

      <WorkflowItemFormDialog
        open={dialog != null}
        timeMode={timeMode}
        usedSpaceIds={usedSpaceIds}
        initial={dialog?.index != null ? items[dialog.index] : null}
        orderNumber={dialog?.index != null ? items[dialog.index].orderNumber : items.length + 1}
        saving={busy}
        onClose={() => setDialog(null)}
        onSave={(draft) => void handleDialogSave(draft)}
      />

      <ConfirmDialog
        open={pendingRemove != null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title={tc('remove')}
        description={t('workflowTab.removeDescription')}
        confirmLabel={tc('remove')}
        destructive
        busy={busy}
        onConfirm={() => {
          if (!pendingRemove) return
          void persist(items.filter((entry) => entry.id !== pendingRemove.id))
          setPendingRemove(null)
        }}
      />
    </Card>
  )
}
