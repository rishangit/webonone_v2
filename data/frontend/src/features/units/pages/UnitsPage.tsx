import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListAddButton,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
  ListPageFooter,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { UnitFormDialog } from '@/features/units/components/UnitFormDialog'
import { UnitsList } from '@/features/units/components/UnitsList'
import { unitsActions } from '@/features/units/store'
import { StatusFilterFields } from '@/shared/components/StatusFilterFields'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

export function UnitsPage() {
  const { t } = useTranslation('units')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canCreate = user?.role === 'super_admin' || user?.role === 'company_admin'
  const canMutate = user?.role === 'super_admin'
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)

  const list = useEpicCatalogList((s) => s.units, unitsActions)
  usePlatformLoading(list.loading ? t('loading') : null)

  if (!accessToken) return <Navigate to="/login" replace />

  return (
    <FeaturePage
      title={t('title')}
      description={t('description')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder={t('search')}
            className="w-64"
            aria-label={t('search')}
          />
          <ListFilterTrigger active={list.hasActiveFilters} onClick={() => list.setFilterOpen(true)} />
          {canCreate ? (
            <ListAddButton onClick={() => setDialog({})} compactLabel={tc('add')}>
              {t('add')}
            </ListAddButton>
          ) : null}
        </div>
      }
    >
      <PlatformHostedListFilterPanel
        path="/embed/panels/units/filters"
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        draft={{ status: list.status }}
        onDraftApply={(draft) => list.setStatus(draft.status)}
        onApply={(draft) => {
          const nextStatus = draft?.status ?? list.status
          if (draft) list.setStatus(nextStatus)
          list.load(1, list.pageSize, true, { status: nextStatus })
        }}
        onClear={() => {
          list.setStatus('all')
          list.load(1, list.pageSize, true, { status: 'all' })
        }}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <StatusFilterFields
          idPrefix="units"
          value={list.status}
          onChange={list.setStatus}
          verifiedLabel={t('verified')}
          unverifiedLabel={t('unverified')}
        />
      </PlatformHostedListFilterPanel>

      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!list.loading ? (
            <UnitsList
              items={list.items}
              onEdit={(id) => setDialog({ id })}
              onDeleted={(id) => {
                dispatch(unitsActions.deleteRequested({ id }))
                list.load(list.page, list.pageSize, true)
              }}
              onVerify={(id) => {
                dispatch(unitsActions.saveDetailRequested({ id, body: { status: 'verified' } }))
                list.load(list.page, list.pageSize, true)
              }}
              canMutate={canMutate}
            />
          ) : null}
        </div>
        <ListPageFooter
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          pageSizeOptions={[12, 24, 48]}
          loadedCount={list.items.length}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          onPageChange={(p) => list.load(p)}
          onPageSizeChange={(size) => list.load(1, size, true)}
          onLoadMore={list.loadMore}
          onModeChange={() => list.load(1, list.pageSize, true)}
        />
      </ListPageBody>

      {dialog !== null ? (
        <UnitFormDialog
          open
          id={dialog.id}
          onOpenChange={(o) => {
            if (!o) setDialog(null)
          }}
          onSaved={() => {
            list.load(list.page, list.pageSize, true)
            setDialog(null)
          }}
        />
      ) : null}
    </FeaturePage>
  )
}
