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
  ItemListStatus,
} from '@webonone/ui-kit'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import {
  SpaceSelectStackedDialogs,
  type SpaceSelectValue,
} from '@/features/services/components/SpaceSelectField'
import { useNavigateDataEntity } from '@/features/shell/utils/navigateDataEntity'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { dataApi } from '@/shared/services/dataApi'
import type { ServiceSpaceLink } from '@/shared/types/data.types'

type ServiceSpacesTabProps = {
  serviceId: string
  canEdit: boolean
}

export function ServiceSpacesTab({ serviceId, canEdit }: ServiceSpacesTabProps) {
  const { t } = useTranslation('services')
  const { goToDetail } = useNavigateDataEntity()
  const [items, setItems] = useState<ServiceSpaceLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<ServiceSpaceLink | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await dataApi.listServiceSpaces(serviceId)
      setItems(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('catalog.spacesLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [serviceId, t])

  useEffect(() => {
    void load()
  }, [load])

  const alreadySelected: SpaceSelectValue[] = items.map((space) => ({
    id: space.id,
    name: space.name,
    description: space.description,
    status: space.status,
  }))

  async function persist(nextIds: string[]) {
    setBusy(true)
    try {
      const result = await dataApi.replaceServiceSpaces(serviceId, nextIds)
      setItems(result.items)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddSpaces(selected: SpaceSelectValue[]) {
    if (selected.length === 0) {
      setPickerOpen(false)
      return
    }
    const nextIds = [...items.map((space) => space.id), ...selected.map((space) => space.id)]
    try {
      await persist(nextIds)
      setPickerOpen(false)
    } catch {
      /* keep picker open */
    }
  }

  async function handleMove(index: number, delta: number) {
    const next = [...items]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    await persist(next.map((space) => space.id))
  }

  async function handleRemove(space: ServiceSpaceLink) {
    const nextIds = items.filter((item) => item.id !== space.id).map((item) => item.id)
    try {
      await persist(nextIds)
    } finally {
      setPendingRemove(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium text-foreground">{t('catalog.spacesTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('catalog.spacesDescription')}</p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setPickerOpen(true)}
            disabled={busy || loading}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('catalog.addSpace')}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading && items.length === 0 ? (
        <ItemListEmpty>{t('catalog.spacesLoading')}</ItemListEmpty>
      ) : items.length === 0 ? (
        <ItemListEmpty>{t('catalog.noSpaces')}</ItemListEmpty>
      ) : (
        <ItemList>
          {items.map((space, index) => (
            <ItemListItem key={space.id}>
              <ItemListContent>
                <button
                  type="button"
                  className="w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => goToDetail('spaces', space.id)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{space.name}</p>
                  </div>
                  {space.description ? (
                    <p className="truncate text-sm text-muted-foreground">{space.description}</p>
                  ) : null}
                </button>
              </ItemListContent>
              <ItemListStatus>
                <StatusBadge status={space.status} />
              </ItemListStatus>
              {canEdit ? (
                <ItemListMenu ariaLabel={t('actionsFor', { name: space.name })}>
                  <DropdownMenuItem
                    disabled={busy || index === 0}
                    onClick={() => {
                      void handleMove(index, -1)
                    }}
                  >
                    {t('catalog.moveUp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={busy || index === items.length - 1}
                    onClick={() => {
                      void handleMove(index, 1)
                    }}
                  >
                    {t('catalog.moveDown')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={busy}
                    onClick={() => setPendingRemove(space)}
                  >
                    {t('catalog.removeSpace')}
                  </DropdownMenuItem>
                </ItemListMenu>
              ) : null}
            </ItemListItem>
          ))}
        </ItemList>
      )}

      <SpaceSelectStackedDialogs
        pickerOpen={pickerOpen}
        alreadySelectedSpaces={alreadySelected}
        onDone={(selected) => {
          void handleAddSpaces(selected)
        }}
        onClosePicker={() => setPickerOpen(false)}
      />

      <PlatformAlertConfirmDialog
        open={pendingRemove !== null}
        title={
          pendingRemove
            ? t('catalog.removeSpaceConfirm', { name: pendingRemove.name })
            : t('catalog.removeSpaceFallback')
        }
        description={t('catalog.removeSpaceDescription')}
        isAllowedParentOrigin={isAllowedParentOrigin}
        submitLabel={t('common:remove')}
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
