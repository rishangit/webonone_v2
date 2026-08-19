import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  DatePicker,
  FeaturePage,
  FormField,
  ListAddButton,
  ListFilterPanel,
  ListFilterTrigger,
  ListPageBody,
  ListPageFooter,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { canManageCompanyEvents } from '@/features/session/utils/canAccessCompanySession'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { SalesList } from '@/features/sales/components/SalesList'
import { salesActions } from '@/features/sales/store'
import { useEpicCatalogList } from '@/shared/hooks/useEpicCatalogList'

function toYmd(date: Date | undefined): string | undefined {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function SalesHistoryPage() {
  const { t } = useTranslation('sales')
  const navigate = useNavigate()
  const activeRole = useAppSelector((s) => s.sessionRole.activeRole)
  const activeCompanyId = useAppSelector((s) => s.sessionRole.activeCompanyId)
  const selectionComplete = useAppSelector((s) => s.sessionRole.selectionComplete)
  const canManage = selectionComplete && canManageCompanyEvents(activeRole, activeCompanyId)

  const list = useEpicCatalogList((s) => s.sales, salesActions)
  const [from, setFrom] = useState<Date | undefined>()
  const [to, setTo] = useState<Date | undefined>()

  usePlatformLoading(list.loading ? t('history.loading') : null)

  if (selectionComplete && !canManage) {
    return <Navigate to="/" replace />
  }

  function applyFilters() {
    const extra: Record<string, string> = {}
    const fromYmd = toYmd(from)
    const toValue = toYmd(to)
    if (fromYmd) extra.from = fromYmd
    if (toValue) extra.to = toValue
    list.setExtraFilters(extra)
    list.setFilterOpen(false)
  }

  return (
    <FeaturePage
      title={t('history.title')}
      description={t('history.description')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={list.q}
            onChange={(event) => list.setQ(event.target.value)}
            onClear={() => list.setQ('')}
            placeholder={t('history.searchPlaceholder')}
            className="w-64"
            aria-label={t('history.searchAria')}
          />
          <ListFilterTrigger
            active={list.filterOpen || list.hasActiveFilters}
            onClick={() => list.setFilterOpen(!list.filterOpen)}
            aria-label={t('history.status')}
          />
          <ListAddButton onClick={() => navigate('/sales/pos')}>{t('history.newSale')}</ListAddButton>
        </div>
      }
    >
      <ListFilterPanel
        open={list.filterOpen}
        onOpenChange={list.setFilterOpen}
        onApply={applyFilters}
        onClear={() => {
          setFrom(undefined)
          setTo(undefined)
          list.setStatus('all')
          list.setExtraFilters({})
        }}
      >
        <div className="grid gap-4">
          <FormField label={t('history.status')} htmlFor="sales-status">
            <Select value={list.status} onValueChange={list.setStatus}>
              <SelectTrigger id="sales-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('history.statusAll')}</SelectItem>
                <SelectItem value="completed">{t('status.completed')}</SelectItem>
                <SelectItem value="void">{t('status.void')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={t('history.from')} htmlFor="sales-from">
            <DatePicker id="sales-from" withIcon value={from} onChange={setFrom} placeholder={t('history.from')} />
          </FormField>
          <FormField label={t('history.to')} htmlFor="sales-to">
            <DatePicker id="sales-to" withIcon value={to} onChange={setTo} placeholder={t('history.to')} />
          </FormField>
        </div>
      </ListFilterPanel>

      {list.error ? (
        <Alert variant="destructive">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <ListPageBody>
        <div className="flex-1">{!list.loading ? <SalesList items={list.items} /> : null}</div>
        <ListPageFooter
          className="mt-auto"
          totalCount={list.total}
          currentPage={list.page}
          pageSize={list.pageSize}
          pageSizeOptions={[12, 24, 48]}
          loadedCount={list.items.length}
          hasMore={list.hasMore}
          loadingMore={list.loadingMore}
          onPageChange={(page) => list.load(page)}
          onPageSizeChange={(size) => list.load(1, size, true)}
          onLoadMore={list.loadMore}
          onModeChange={() => list.load(1, list.pageSize, true)}
        />
      </ListPageBody>
    </FeaturePage>
  )
}
