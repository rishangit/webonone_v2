import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  FeaturePage,
  ListAddButton,
  ListPageBody,
  SearchInput,
  Pagination,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import { usePlatformLoading } from '@/features/shell/context/PlatformLoadingContext'
import { isFresh } from '@/shared/store/cacheUtils'
import { CompanyFormDialog } from '../components/CompanyFormDialog'
import { MyCompaniesList } from '../components/MyCompaniesList'

export function AllCompaniesPage() {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const {
    myCompanies,
    myCompaniesStatus,
    myCompaniesError,
    myCompaniesFetchedAt,
  } = useAppSelector((s) => s.companies)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const ownedCompanies = useMemo(
    () => myCompanies.filter((item) => item.role === 'company_admin'),
    [myCompanies],
  )

  const awaitingFirstLoad =
    myCompaniesFetchedAt === null && myCompanies.length === 0 && myCompaniesStatus !== 'error'

  usePlatformLoading(awaitingFirstLoad ? t('myCompanies.loading') : null)

  useEffect(() => {
    if (!isFresh(myCompaniesFetchedAt)) {
      dispatch(companiesActions.loadMyCompaniesRequested())
    }
  }, [dispatch, myCompaniesFetchedAt])

  const filteredItems = searchQuery.trim()
    ? ownedCompanies.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : ownedCompanies

  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize)

  if (awaitingFirstLoad) {
    return null
  }

  return (
    <FeaturePage
      title={t('myCompanies.title')}
      description={t('myCompanies.description')}
      actions={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setPage(1)
            }}
            placeholder={t('myCompanies.searchPlaceholder')}
            onClear={() => setPage(1)}
            aria-label={t('myCompanies.searchAria')}
            className="w-64"
          />
          <ListAddButton onClick={() => setRegisterOpen(true)}>{t('myCompanies.addCompany')}</ListAddButton>
        </div>
      }
    >
      {myCompaniesError ? (
        <Alert variant="destructive">
          <AlertDescription>{myCompaniesError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? <p className="text-sm text-primary">{successMessage}</p> : null}

      <ListPageBody>
        <div className="flex-1">
          <MyCompaniesList items={visibleItems} emptyMessage={t('myCompanies.empty')} />
        </div>
        <Pagination
          className="mt-auto"
          totalCount={filteredItems.length}
          currentPage={page}
          pageSize={pageSize}
          pageSizeOptions={[12, 24, 48]}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPage(1)
          }}
        />
      </ListPageBody>

      <p className="text-sm text-muted-foreground">
        {t('myCompanies.lookingForSettings')}{' '}
        <Link to="/settings/basic" className="text-primary underline-offset-4 hover:underline">
          {t('myCompanies.basicSettingsLink')}
        </Link>
      </p>

      <CompanyFormDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSaved={() => {
          setSuccessMessage(t('myCompanies.registrationSubmitted'))
        }}
      />
    </FeaturePage>
  )
}
