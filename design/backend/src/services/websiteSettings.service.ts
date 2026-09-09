import { db } from '../models/db.js'
import { HttpError } from './httpError.js'
import { getCompanyFromWebOnOne } from './webononeCompanyClient.js'
import { getWebsitePage } from './websitePage.service.js'
import type { UpdateWebsiteSettingsBody } from '../schemas/websiteSettings.schema.js'

export type WebsiteSiteSettingsDto = {
  companyId: string
  homePageId: string | null
  updatedAt: string
}

type SettingsRow = {
  company_id: string
  home_page_id: string | null
  updated_at: Date
}

function toDto(row: SettingsRow): WebsiteSiteSettingsDto {
  return {
    companyId: row.company_id,
    homePageId: row.home_page_id,
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function getWebsiteSiteSettings(input: {
  companyId: string
}): Promise<WebsiteSiteSettingsDto> {
  const row = await db<SettingsRow>('design_website_site_settings')
    .where({ company_id: input.companyId })
    .first()
  if (!row) {
    return {
      companyId: input.companyId,
      homePageId: null,
      updatedAt: new Date(0).toISOString(),
    }
  }
  return toDto(row)
}

async function assertHomePage(input: { companyId: string; homePageId: string | null }) {
  if (!input.homePageId) return
  const page = await getWebsitePage({ companyId: input.companyId, id: input.homePageId })
  if (page.status !== 'active') {
    throw new HttpError(400, 'Home page must be an active page', 'WEBSITE_HOME_PAGE_INACTIVE')
  }
}

export async function updateWebsiteSiteSettings(input: {
  companyId: string
  body: UpdateWebsiteSettingsBody
}): Promise<WebsiteSiteSettingsDto> {
  await getCompanyFromWebOnOne(input.companyId)
  await assertHomePage({ companyId: input.companyId, homePageId: input.body.homePageId })

  const existing = await db<SettingsRow>('design_website_site_settings')
    .where({ company_id: input.companyId })
    .first()

  if (existing) {
    await db('design_website_site_settings')
      .where({ company_id: input.companyId })
      .update({
        home_page_id: input.body.homePageId,
        updated_at: db.fn.now(3),
      })
  } else {
    await db('design_website_site_settings').insert({
      company_id: input.companyId,
      home_page_id: input.body.homePageId,
      created_at: db.fn.now(3),
      updated_at: db.fn.now(3),
    })
  }

  return getWebsiteSiteSettings({ companyId: input.companyId })
}
