import { HttpError } from './httpError.js'
import { getWebsitePageByPath, listWebsitePages, type WebsitePageDto } from './websitePage.service.js'
import { getDefaultWebsiteChrome, type WebsiteChromeDto } from './websiteChrome.service.js'
import { getDefaultWebsiteTheme, type WebsiteThemeDto } from './websiteTheme.service.js'

export type PublicWebsiteSiteDto = {
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
  try {
    const [page, header, footer, theme, listed] = await Promise.all([
      getWebsitePageByPath(input),
      getDefaultWebsiteChrome({ kind: 'headers', companyId: input.companyId }),
      getDefaultWebsiteChrome({ kind: 'footers', companyId: input.companyId }),
      getDefaultWebsiteTheme({ companyId: input.companyId }),
      listWebsitePages({ companyId: input.companyId, page: 1, pageSize: 100, status: 'active' }),
    ])
    return {
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
