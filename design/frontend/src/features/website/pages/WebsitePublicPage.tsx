import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoadingState } from '@webonone/ui-kit'
import { fetchPublicWebsiteSite } from '../api'
import { DocumentRenderer } from '../components/DocumentRenderer'
import { collectGoogleFontUrls } from '../document/mutate'
import { emptyWebsiteDocument, getBreakpointFromWidth } from '../types'
import type { PublicWebsiteSite, WebsiteBreakpoint } from '../types'

export function WebsitePublicPage() {
  const { t } = useTranslation('website')
  const navigate = useNavigate()
  const { companyId, '*': splat } = useParams<{ companyId: string; '*': string }>()
  const path = (splat ?? '').replace(/^\/+/, '')
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
    if (!companyId) return
    let cancelled = false
    fetchPublicWebsiteSite(companyId, path)
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
  }, [companyId, path])

  const fonts = useMemo(() => {
    const urls = new Set(collectGoogleFontUrls(site?.theme ?? null, site?.page.document))
    for (const extra of [site?.header?.document, site?.footer?.document]) {
      if (!extra) continue
      for (const url of collectGoogleFontUrls(null, extra)) urls.add(url)
    }
    return [...urls]
  }, [site])

  if (missing || !companyId) {
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

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: site.theme?.pageBackground, color: site.theme?.bodyTextColor }}
    >
      {fonts.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      {site.header ? (
        <div className="sticky top-0 z-20">
          <DocumentRenderer
            document={site.header.document ?? emptyWebsiteDocument()}
            breakpoint={breakpoint}
            theme={site.theme}
            mode="publish"
            pages={pages}
            companyId={companyId}
            onNavigatePage={(next) => navigate(`/s/${companyId}${next ? `/${next}` : ''}`)}
          />
        </div>
      ) : null}
      <div className="flex-1 overflow-auto">
        <DocumentRenderer
          document={site.page.document}
          breakpoint={breakpoint}
          theme={site.theme}
          mode="publish"
          pages={pages}
          companyId={companyId}
          onNavigatePage={(next) => navigate(`/s/${companyId}${next ? `/${next}` : ''}`)}
        />
      </div>
      {site.footer ? (
        <div className="sticky bottom-0 z-20">
          <DocumentRenderer
            document={site.footer.document ?? emptyWebsiteDocument()}
            breakpoint={breakpoint}
            theme={site.theme}
            mode="publish"
            pages={pages}
            companyId={companyId}
            onNavigatePage={(next) => navigate(`/s/${companyId}${next ? `/${next}` : ''}`)}
          />
        </div>
      ) : null}
    </div>
  )
}
