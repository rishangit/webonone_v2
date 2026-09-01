import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PlatformHostedListFilterPanel } from '@webonone/platform-embed'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListAddButton,
  FormField,
  ListFilterTrigger,
  ListPageBody,
  SearchInput,
  ListPageFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import type { AttributesFilterDraft } from '@/features/attributes/pages/AttributesFilterEmbedPage'
import { AttributeFormDialog } from '@/features/attributes/components/AttributeFormDialog'
import { AttributesList } from '@/features/attributes/components/AttributesList'
import { attributesActions } from '@/features/attributes/store'
import { StatusFilterFields } from '@/shared/components/StatusFilterFields'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

export function AttributesPage() {
  const { t } = useTranslation('attributes')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { accessToken, user } = useAppSelector((s) => s.auth)
  const canCreate = user?.role === 'super_admin' || user?.role === 'company_admin'
  const canMutate = user?.role === 'super_admin'
  const [dialog, setDialog] = useState<{ id?: string } | null>(null)

  const list = useEpicCatalogList((s) => s.attributes, attributesActions)
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
      <PlatformHostedListFilterPanel<AttributesFilterDraft>
        path="/embed/panels/attributes/filters"
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        draft={{
          status: list.status,
          value_type: list.extraFilters.value_type ?? 'all',
        }}
        onDraftApply={(draft) => {
          list.setStatus(draft.status)
          list.setExtraFilters(draft.value_type === 'all' ? {} : { value_type: draft.value_type })
        }}
        onApply={(draft) => {
          if (draft) {
            list.setStatus(draft.status)
            list.setExtraFilters(draft.value_type === 'all' ? {} : { value_type: draft.value_type })
            list.load(1, list.pageSize, true, {
              status: draft.status,
              extra: draft.value_type === 'all' ? {} : { value_type: draft.value_type },
            })
            return
          }
          list.load(1, list.pageSize, true)
        }}
        onClear={() => {
          list.setStatus('all')
          list.setExtraFilters({})
          list.load(1, list.pageSize, true, { status: 'all', extra: {} })
        }}
        isAllowedParentOrigin={isAllowedParentOrigin}
      >
        <StatusFilterFields
          idPrefix="attributes"
          value={list.status}
          onChange={list.setStatus}
          verifiedLabel={t('verified')}
          unverifiedLabel={t('unverified')}
        />
        <FormField label={t('valueType')} htmlFor="attributes-value-type">
          <Select
            value={list.extraFilters.value_type ?? 'all'}
            onValueChange={(v) => list.setExtraFilters(v === 'all' ? {} : { value_type: v })}
          >
            <SelectTrigger id="attributes-value-type">
              <SelectValue placeholder={tc('all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              <SelectItem value="number">{t('number')}</SelectItem>
              <SelectItem value="text">{t('text')}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </PlatformHostedListFilterPanel>

      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">
          {!list.loading ? (
            <AttributesList
              items={list.items}
              onEdit={(id) => setDialog({ id })}
              onDeleted={(id) => {
                dispatch(attributesActions.deleteRequested({ id }))
                list.load(list.page, list.pageSize, true)
              }}
              onVerify={(id) => {
                dispatch(attributesActions.saveDetailRequested({ id, body: { status: 'verified' } }))
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
        <AttributeFormDialog
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
