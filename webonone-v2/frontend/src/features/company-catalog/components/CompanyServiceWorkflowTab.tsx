import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { PlatformAlertConfirmDialog } from '@webonone/platform-embed'
import {
  Button,
  DropdownMenuItem,
  DropdownMenuSeparator,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  ItemListMenu,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { designFormsApi, type DesignFormTemplateListItem } from '@/features/design/services/designFormsApi'
import { WorkflowItemFormDialog } from '@/features/company-catalog/components/WorkflowItemFormDialog'
import { companyCatalogApi } from '../services/companyCatalogApi'
import type { ServiceWorkflowItem } from '../types/companyCatalog.types'
import { hydrateLinkedCatalogItems } from '../utils/hydrateLinkedCatalog'

type CompanyServiceWorkflowTabProps = {
  serviceId: string
  companyId?: string
  timeMode?: 'duration' | 'window'
  canEdit: boolean
}

function toPutBody(items: ServiceWorkflowItem[]) {
  return items.map((item) => ({
    kind: item.kind ?? 'space',
    space_id: item.space?.id ?? null,
    staff_ids: item.staff.map((entry) => entry.id),
    form_ids: item.forms.map((entry) => entry.id),
    session_queue: Boolean(item.sessionQueue),
  }))
}

function workflowItemLabel(
  item: ServiceWorkflowItem,
  t: (key: string) => string,
): string {
  if (item.kind === 'check_in') return t('workflowTab.checkIn')
  return item.space?.name ?? t('workflowTab.checkIn')
}

export function CompanyServiceWorkflowTab({
  serviceId,
  companyId,
  timeMode,
  canEdit,
}: CompanyServiceWorkflowTabProps) {
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
        companyId
          ? companyCatalogApi.listServiceWorkflowForCompany(companyId, serviceId)
          : companyCatalogApi.listServiceWorkflow(serviceId),
        companyId
          ? companyCatalogApi.listForCompany(companyId, 'spaces')
          : companyCatalogApi.list('spaces'),
        designFormsApi.listPublished().catch(() => ({ items: [] as DesignFormTemplateListItem[] })),
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
          sessionQueue: Boolean(
            item.sessionQueue ?? (item as { session_queue?: boolean }).session_queue,
          ),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workflowTab.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [companyId, serviceId, t])

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
          sessionQueue: Boolean(
            item.sessionQueue ?? (item as { session_queue?: boolean }).session_queue,
          ),
        })),
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleMove(index: number, delta: number) {
    const next = [...items]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    if (index === 0 || target === 0) return
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    await persist(next)
  }

  async function handleRemove(item: ServiceWorkflowItem) {
    if (item.kind === 'check_in') return
    try {
      await persist(items.filter((entry) => entry.id !== item.id))
    } finally {
      setPendingRemove(null)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('workflowTab.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('workflowTab.description')}</p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setDialog({ index: null })}
            disabled={busy || loading}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('workflowTab.add')}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && items.length === 0 ? (
        <ItemListEmpty>{t('workflowTab.loading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('workflowTab.empty')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((item, index) => (
            <ItemListItem key={item.id}>
              <ItemListContent>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                    #{item.orderNumber}
                  </span>
                  <p className="truncate font-medium">{workflowItemLabel(item, t)}</p>
                </div>
                {item.space && item.kind === 'check_in' ? (
                  <p className="truncate text-sm text-muted-foreground">{item.space.name}</p>
                ) : null}
                <p className="truncate text-sm text-muted-foreground">
                  {t('workflowTab.staffLine', {
                    value:
                      item.staff.length > 0
                        ? item.staff.map((entry) => entry.displayName).join(', ')
                        : t('workflowTab.none'),
                  })}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {t('workflowTab.formsLine', {
                    value:
                      item.forms.length > 0
                        ? item.forms.map((entry) => entry.name ?? entry.id).join(', ')
                        : t('workflowTab.none'),
                  })}
                </p>
                {timeMode === 'window' ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {t('workflowTab.queueLine', {
                      value: item.sessionQueue ? t('workflowTab.yes') : t('workflowTab.no'),
                    })}
                  </p>
                ) : null}
              </ItemListContent>
              {canEdit ? (
                <ItemListMenu ariaLabel={t('workflowTab.actionsFor', { name: workflowItemLabel(item, t) })}>
                  <DropdownMenuItem
                    disabled={busy}
                    onClick={() => setDialog({ index })}
                  >
                    {t('workflowTab.edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={busy || index === 0 || index === 1}
                    onClick={() => {
                      void handleMove(index, -1)
                    }}
                  >
                    {t('workflowTab.moveUp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={busy || index === 0 || index === items.length - 1}
                    onClick={() => {
                      void handleMove(index, 1)
                    }}
                  >
                    {t('workflowTab.moveDown')}
                  </DropdownMenuItem>
                  {item.kind !== 'check_in' ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={busy}
                        onClick={() => setPendingRemove(item)}
                      >
                        {t('workflowTab.remove')}
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}

      {dialog ? (
        <WorkflowItemFormDialog
          open
          companyId={companyId}
          timeMode={timeMode}
          usedSpaceIds={items
            .filter((_, index) => index !== dialog.index)
            .filter((item) => item.kind === 'space' && item.space)
            .map((item) => item.space!.id)}
          initial={dialog.index == null ? null : items[dialog.index] ?? null}
          orderNumber={
            dialog.index == null
              ? items.length + 1
              : items[dialog.index]?.orderNumber ?? dialog.index + 1
          }
          saving={busy}
          onClose={() => setDialog(null)}
          onSave={(draft) => {
            void handleDialogSave(draft)
          }}
        />
      ) : null}

      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={
          pendingRemove
            ? t('workflowTab.removeConfirm', { name: workflowItemLabel(pendingRemove, t) })
            : t('workflowTab.removeFallback')
        }
        description={t('workflowTab.removeDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={tc('remove')}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        onConfirm={() => {
          if (pendingRemove) {
            void handleRemove(pendingRemove)
          }
        }}
      />
    </div>
  )
}
