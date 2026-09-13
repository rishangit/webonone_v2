import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '@webonone/ui-kit'
import { fetchPublicWebsiteDatasetData, fetchPublicWebsiteSite } from '../api'
import { DocumentRenderer } from '../components/DocumentRenderer'
import { collectBoundDatasetIds } from '../document/dataBinding'
import { collectGoogleFontUrls } from '../document/mutate'
import { documentContentHeight } from '../document/layout'
import { emptyWebsiteDocument, getBreakpointFromWidth } from '../types'
import type { PublicWebsiteSite, WebsiteBreakpoint } from '../types'
import { getCompanyPublicHostSlug, publicPageHref } from '../utils/companyPublicHost'

export function WebsitePublicPage() {
  const { t } = useTranslation('website')
  const navigate = useNavigate()
  const location = useLocation()
  const hostSlug = getCompanyPublicHostSlug()
  const { companyId: paramId, '*': splat } = useParams<{ companyId: string; '*': string }>()
  const companyKey = hostSlug ?? paramId
  const path = hostSlug
    ? location.pathname.replace(/^\/+/, '')
    : (splat ?? '').replace(/^\/+/, '')
  const [site, setSite] = useState<PublicWebsiteSite | null>(null)
  const [missing, setMissing] = useState(false)
  const [datasetItemsById, setDatasetItemsById] = useState<Record<string, Record<string, unknown>[]>>({})
  const [datasetsReady, setDatasetsReady] = useState(false)
  const [breakpoint, setBreakpoint] = useState<WebsiteBreakpoint>(() =>
    typeof window === 'undefined' ? '2xl' : getBreakpointFromWidth(window.innerWidth),
  )

  useEffect(() => {
    function onResize() {
      setBreakpoint(getBreakpointFromWidth(window.innerWidth))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!companyKey) return
    let cancelled = false
    setDatasetsReady(false)
    fetchPublicWebsiteSite(companyKey, path)
      .then((data) => {
        if (!cancelled) {
          setSite(data)
          setMissing(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSite(null)
          setMissing(true)
          setDatasetsReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyKey, path])

  useEffect(() => {
    if (!site || !companyKey) return
    let cancelled = false
    const ids = new Set<string>([
      ...collectBoundDatasetIds(site.page.document),
      ...collectBoundDatasetIds(site.header?.document ?? emptyWebsiteDocument()),
      ...collectBoundDatasetIds(site.footer?.document ?? emptyWebsiteDocument()),
    ])
    if (ids.size === 0) {
      setDatasetItemsById({})
      setDatasetsReady(true)
      return
    }
    setDatasetsReady(false)
    Promise.all(
      [...ids].map(async (datasetId) => {
        try {
          const result = await fetchPublicWebsiteDatasetData(site.companyId || companyKey, datasetId)
          return [datasetId, result.items] as const
        } catch {
          return [datasetId, [] as Record<string, unknown>[]] as const
        }
      }),
    ).then((entries) => {
      if (cancelled) return
      setDatasetItemsById(Object.fromEntries(entries))
      setDatasetsReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [companyKey, site])

  const fonts = useMemo(() => {
    const urls = new Set(collectGoogleFontUrls(site?.theme ?? null, site?.page.document))
    for (const extra of [site?.header?.document, site?.footer?.document]) {
      if (!extra) continue
      for (const url of collectGoogleFontUrls(null, extra)) urls.add(url)
    }
    return [...urls]
  }, [site])

  if (missing || !companyKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-2xl font-semibold">{t('notFoundTitle')}</h1>
        <p className="text-muted-foreground">{t('notFoundDescription')}</p>
      </div>
    )
  }

  if (!site || !datasetsReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label={t('loading')} />
      </div>
    )
  }

  const pages = site.pages.length > 0 ? site.pages : [{ id: site.page.id, path: site.page.path, name: site.page.name }]
  const headerDocument = site.header?.document ?? emptyWebsiteDocument()
  const footerDocument = site.footer?.document ?? emptyWebsiteDocument()
  const showHeader = Boolean(site.header) && documentContentHeight(headerDocument, breakpoint) > 0
  const showFooter = Boolean(site.footer) && documentContentHeight(footerDocument, breakpoint) > 0
  const navKey = site.webSlug || site.companyId || companyKey
  const goToPage = (next: string) => navigate(publicPageHref(navKey, next))

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: site.theme?.pageBackground, color: site.theme?.bodyTextColor }}
    >
      {fonts.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      {showHeader ? (
        <div className="sticky top-0 z-20">
          <DocumentRenderer
            document={headerDocument}
            breakpoint={breakpoint}
            theme={site.theme}
            mode="publish"
            fit="content"
            pages={pages}
            currentPageId={site.page.id}
            companyId={site.companyId || companyKey}
            datasetItemsById={datasetItemsById}
            onNavigatePage={goToPage}
          />
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">
        <DocumentRenderer
          document={site.page.document}
          breakpoint={breakpoint}
          theme={site.theme}
          mode="publish"
          fit="page"
          pages={pages}
          currentPageId={site.page.id}
          companyId={site.companyId || companyKey}
          datasetItemsById={datasetItemsById}
          onNavigatePage={goToPage}
        />
      </div>
      {showFooter ? (
        <DocumentRenderer
          document={footerDocument}
          breakpoint={breakpoint}
          theme={site.theme}
          mode="publish"
          fit="content"
          pages={pages}
          companyId={site.companyId || companyKey}
          datasetItemsById={datasetItemsById}
          onNavigatePage={goToPage}
        />
      ) : null}
    </div>
  )
}
