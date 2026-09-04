import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '@webonone/ui-kit'
import { fetchPublicWebsiteSite } from '../api'
import { DocumentRenderer } from '../components/DocumentRenderer'
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
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyKey, path])

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

  if (!site) {
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
            companyId={site.companyId || companyKey}
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
          companyId={site.companyId || companyKey}
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
          onNavigatePage={goToPage}
        />
      ) : null}
    </div>
  )
}
