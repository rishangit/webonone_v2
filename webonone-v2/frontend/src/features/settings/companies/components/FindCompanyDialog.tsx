import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  ImagePreview,
  ItemList,
  ItemListContent,
  ItemListEmpty,
  ItemListItem,
  SearchInput,
  Spinner,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { companiesActions } from '@/features/settings/basic/store/companiesStore'
import {
  companyApi,
  type DiscoverCompanySummary,
} from '@/features/settings/basic/services/companyApi'
import { CompanyMemberProfileView } from './CompanyMemberProfileView'
import { formatCountryName } from '../utils/formatCountryName'

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 12

type DialogStep = 'search' | 'detail'

export interface FindCompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected?: () => void
}

function formatLocation(city: string | null, country: string | null): string | null {
  const parts = [city?.trim() || null, country?.trim() ? formatCountryName(country) : null].filter(
    Boolean,
  )
  return parts.length > 0 ? parts.join(', ') : null
}

export function FindCompanyDialog({ open, onOpenChange, onConnected }: FindCompanyDialogProps) {
  const { t } = useTranslation('settings')
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const connectCompanyStatus = useAppSelector((s) => s.companies.connectCompanyStatus)
  const connectCompanyError = useAppSelector((s) => s.companies.connectCompanyError)

  const [step, setStep] = useState<DialogStep>('search')
  const [detailCompanyId, setDetailCompanyId] = useState<string | null>(null)
  const [detailCompanyName, setDetailCompanyName] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<DiscoverCompanySummary[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openGeneration, setOpenGeneration] = useState(0)

  const scrollRootRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)
  const prevOpenRef = useRef(false)
  const wasConnectingRef = useRef(false)

  const fetchPage = useCallback(async (targetPage: number, replace: boolean) => {
    if (loadingRef.current) {
      return
    }
    loadingRef.current = true

    const requestId = ++requestIdRef.current
    const isFirstPage = targetPage === 1

    if (isFirstPage) {
      setInitialLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const result = await companyApi.searchDiscoverableCompanies({
        q: debouncedSearch,
        page: targetPage,
        pageSize: PAGE_SIZE,
      })

      if (requestId !== requestIdRef.current) {
        return
      }

      setItems((prev) => (replace ? result.items : [...prev, ...result.items]))
      setPage(targetPage)
      setHasMore(result.hasMore)
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return
      }
      setError(err instanceof Error ? err.message : t('connectedCompanies.findDialogLoadFailed'))
      if (replace) {
        setItems([])
        setHasMore(false)
      }
    } finally {
      loadingRef.current = false
      if (requestId === requestIdRef.current) {
        setInitialLoading(false)
        setLoadingMore(false)
      }
    }
  }, [debouncedSearch, t])

  useEffect(() => {
    if (!open) {
      requestIdRef.current += 1
      prevOpenRef.current = false
      wasConnectingRef.current = false
      dispatch(companiesActions.resetConnectCompanyState())
      return
    }
    if (!prevOpenRef.current) {
      setStep('search')
      setDetailCompanyId(null)
      setDetailCompanyName(null)
      setSearchInput('')
      setDebouncedSearch('')
      setItems([])
      setPage(1)
      setHasMore(false)
      setError(null)
      setInitialLoading(false)
      setLoadingMore(false)
      requestIdRef.current += 1
      setOpenGeneration((value) => value + 1)
      dispatch(companiesActions.resetConnectCompanyState())
    }
    prevOpenRef.current = open
  }, [dispatch, open])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!open || step !== 'search') return
    void fetchPage(1, true)
  }, [debouncedSearch, fetchPage, open, openGeneration, step])

  useEffect(() => {
    const root = scrollRootRef.current
    const sentinel = sentinelRef.current
    if (!open || step !== 'search' || !root || !sentinel || !hasMore || initialLoading || loadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchPage(page + 1, false)
        }
      },
      { root, rootMargin: '120px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage, hasMore, initialLoading, loadingMore, open, page, step])

  useEffect(() => {
    if (connectCompanyStatus === 'connecting') {
      wasConnectingRef.current = true
      return
    }
    if (!wasConnectingRef.current) {
      return
    }
    wasConnectingRef.current = false

    if (connectCompanyStatus === 'idle' && !connectCompanyError) {
      toast({ title: t('connectedCompanies.findDialogConnectSuccess') })
      onConnected?.()
      onOpenChange(false)
      return
    }

    if (connectCompanyStatus === 'error' && connectCompanyError) {
      toast({
        title: t('connectedCompanies.findDialogConnectFailed'),
        description: connectCompanyError,
        variant: 'destructive',
      })
      dispatch(companiesActions.resetConnectCompanyState())
    }
  }, [
    connectCompanyError,
    connectCompanyStatus,
    dispatch,
    onConnected,
    onOpenChange,
    t,
    toast,
  ])

  function handleOpenCompany(item: DiscoverCompanySummary) {
    setDetailCompanyId(item.id)
    setDetailCompanyName(item.name)
    setStep('detail')
  }

  function handleBackToSearch() {
    setStep('search')
    setDetailCompanyId(null)
    setDetailCompanyName(null)
  }

  function handleConnect() {
    if (!detailCompanyId || connectCompanyStatus === 'connecting') {
      return
    }
    dispatch(companiesActions.connectCompanyRequested({ companyId: detailCompanyId }))
  }

  function handleRetry() {
    void fetchPage(1, true)
  }

  const showEmpty = !initialLoading && !error && items.length === 0
  const dialogTitle =
    step === 'detail' && detailCompanyName
      ? detailCompanyName
      : t('connectedCompanies.findDialogTitle')

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialogTitle}
      description={
        step === 'search' ? t('connectedCompanies.findDialogDescription') : undefined
      }
      sizeWidth="large"
      sizeHeight="xlarge"
      disableContentScroll
      footer={
        step === 'search' ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            {t('common:cancel')}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => onOpenChange(false)}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="button"
              className="h-10"
              disabled={!detailCompanyId || connectCompanyStatus === 'connecting'}
              onClick={handleConnect}
            >
              {connectCompanyStatus === 'connecting' ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Plus className="mr-2 h-4 w-4" aria-hidden />
              )}
              {t('connectedCompanies.findDialogAdd')}
            </Button>
          </>
        )
      }
    >
      {step === 'search' ? (
        <div className="flex h-full min-h-0 flex-col gap-4 p-6">
          <SearchInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('connectedCompanies.findDialogSearchPlaceholder')}
            aria-label={t('connectedCompanies.findDialogSearchAria')}
          />

          <div
            ref={scrollRootRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-md border border-[hsl(var(--glass-border))] scrollbar-themed"
          >
            {error ? (
              <Alert variant="destructive" className="m-4">
                <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    {t('common:retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}

            {initialLoading ? (
              <div className="flex items-center justify-center gap-2 py-12">
                <Spinner size="lg" />
                <span className="text-sm text-muted-foreground">
                  {t('connectedCompanies.findDialogLoading')}
                </span>
              </div>
            ) : null}

            {showEmpty ? (
              <ItemListEmpty>{t('connectedCompanies.findDialogEmpty')}</ItemListEmpty>
            ) : null}

            {!initialLoading && items.length > 0 ? (
              <ItemList className="py-2">
                {items.map((item) => {
                  const subtitle = formatLocation(item.city, item.country)
                  return (
                    <ItemListItem
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer transition-colors hover:border-primary/40"
                      aria-label={t('connectedCompanies.findDialogOpenAria', { name: item.name })}
                      onClick={() => handleOpenCompany(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleOpenCompany(item)
                        }
                      }}
                    >
                      <ImagePreview
                        src={item.logoUrl}
                        alt={item.name}
                        mode="view"
                        className="h-10 w-10 rounded-md"
                      />
                      <ItemListContent>
                        <p className="truncate font-medium">{item.name}</p>
                        {subtitle ? (
                          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                        ) : null}
                      </ItemListContent>
                    </ItemListItem>
                  )
                })}
              </ItemList>
            ) : null}

            {loadingMore ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : null}
            <div ref={sentinelRef} className="h-1" aria-hidden />
          </div>
        </div>
      ) : detailCompanyId ? (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-y-contain p-6 scrollbar-themed">
          <CompanyMemberProfileView
            companyId={detailCompanyId}
            previewMode
            embedInDialog
            onBack={handleBackToSearch}
          />
        </div>
      ) : null}
    </CustomDialog>
  )
}
