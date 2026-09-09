import { HttpError } from './httpError.js'
import { resolveCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { getWebsitePageByPath, listWebsitePages, type WebsitePageDto } from './websitePage.service.js'
import { getDefaultWebsiteChrome, getWebsiteChrome, type WebsiteChromeDto } from './websiteChrome.service.js'
import { getDefaultWebsiteTheme, getWebsiteTheme, type WebsiteThemeDto } from './websiteTheme.service.js'
import { resolveLayoutForPage } from './websiteLayout.service.js'
import { rewriteWebsiteDocumentMedia } from '../utils/rewriteWebsiteDocumentMedia.js'

export type PublicWebsiteSiteDto = {
  companyId: string
  webSlug: string
  webUrl: string
  page: WebsitePageDto
  header: WebsiteChromeDto | null
  footer: WebsiteChromeDto | null
  theme: WebsiteThemeDto | null
  pages: Array<{ id: string; name: string; path: string }>
  navPages: Array<{ id: string; name: string; path: string }>
}

async function chromeOrNull(input: {
  kind: 'headers' | 'footers'
  companyId: string
  id: string | null
}): Promise<WebsiteChromeDto | null> {
  if (!input.id) return null
  try {
    const item = await getWebsiteChrome({ kind: input.kind, companyId: input.companyId, id: input.id })
    return { ...item, document: rewriteWebsiteDocumentMedia(item.document) }
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null
    throw err
  }
}

async function defaultChrome(input: {
  kind: 'headers' | 'footers'
  companyId: string
}): Promise<WebsiteChromeDto | null> {
  const item = await getDefaultWebsiteChrome(input)
  return item ? { ...item, document: rewriteWebsiteDocumentMedia(item.document) } : null
}

async function themeForLayout(companyId: string, themeId: string | null | undefined): Promise<WebsiteThemeDto | null> {
  if (themeId) {
    try {
      return await getWebsiteTheme({ companyId, id: themeId })
    } catch (err) {
      if (!(err instanceof HttpError && err.status === 404)) throw err
    }
  }
  return getDefaultWebsiteTheme({ companyId })
}

export async function getPublicWebsiteSite(input: {
  companyId: string
  path: string
}): Promise<PublicWebsiteSiteDto> {
  const company = await resolveCompanyFromWebOnOne(input.companyId)
  const companyId = company.id
  try {
    const [page, listed] = await Promise.all([
      getWebsitePageByPath({ companyId, path: input.path }),
      listWebsitePages({ companyId, page: 1, pageSize: 100, status: 'active' }),
    ])
    const resolvedLayout = await resolveLayoutForPage({ companyId, layoutId: page.layoutId })
    const [header, footer, theme] = resolvedLayout
      ? await Promise.all([
          chromeOrNull({ kind: 'headers', companyId, id: resolvedLayout.headerId }),
          chromeOrNull({ kind: 'footers', companyId, id: resolvedLayout.footerId }),
          themeForLayout(companyId, resolvedLayout.themeId),
        ])
      : await Promise.all([
          defaultChrome({ kind: 'headers', companyId }),
          defaultChrome({ kind: 'footers', companyId }),
          getDefaultWebsiteTheme({ companyId }),
        ])
    return {
      companyId,
      webSlug: company.webSlug,
      webUrl: company.webUrl,
      page: { ...page, document: rewriteWebsiteDocumentMedia(page.document) },
      header,
      footer,
      theme,
      pages: listed.items.map((item) => ({ id: item.id, name: item.name, path: item.path })),
      navPages: (resolvedLayout?.pages ?? [])
        .filter((item) => item.status === 'active')
        .map((item) => ({ id: item.id, name: item.name, path: item.path })),
    }
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw err
  }
}
