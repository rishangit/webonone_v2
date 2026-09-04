import { HttpError } from './httpError.js'
import { resolveCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { getWebsitePageByPath, listWebsitePages, type WebsitePageDto } from './websitePage.service.js'
import { getDefaultWebsiteChrome, type WebsiteChromeDto } from './websiteChrome.service.js'
import { getDefaultWebsiteTheme, type WebsiteThemeDto } from './websiteTheme.service.js'

export type PublicWebsiteSiteDto = {
  companyId: string
  webSlug: string
  webUrl: string
  page: WebsitePageDto
  header: WebsiteChromeDto | null
  footer: WebsiteChromeDto | null
  theme: WebsiteThemeDto | null
  pages: Array<{ id: string; name: string; path: string }>
}

export async function getPublicWebsiteSite(input: {
  companyId: string
  path: string
}): Promise<PublicWebsiteSiteDto> {
  const company = await resolveCompanyFromWebOnOne(input.companyId)
  const companyId = company.id
  try {
    const [page, header, footer, theme, listed] = await Promise.all([
      getWebsitePageByPath({ companyId, path: input.path }),
      getDefaultWebsiteChrome({ kind: 'headers', companyId }),
      getDefaultWebsiteChrome({ kind: 'footers', companyId }),
      getDefaultWebsiteTheme({ companyId }),
      listWebsitePages({ companyId, page: 1, pageSize: 100, status: 'active' }),
    ])
    return {
      companyId,
      webSlug: company.webSlug,
      webUrl: company.webUrl,
      page,
      header,
      footer,
      theme,
      pages: listed.items.map((item) => ({ id: item.id, name: item.name, path: item.path })),
    }
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw err
  }
}
