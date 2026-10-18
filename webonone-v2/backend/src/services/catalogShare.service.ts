import { listLibraryItemsByIds, type CatalogKind } from '../clients/dataCatalogClient.js'
import * as roleRepo from '../clients/identityRoleClient.js'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import * as companyRepo from '../repositories/company.repository.js'
import type { CatalogEntityKind } from '../schemas/companyCatalogSchemas.js'
import { publicCatalogItemUrl } from '../utils/webOnOneAppLinks.js'
import { sendTransactionalEmail } from './emailClient.service.js'
import { sendTransactionalSms } from './smsClient.service.js'

const TEMPLATE_SLUG = 'catalog_item_share'

const ITEM_KIND_LABEL: Record<CatalogKind, string> = {
  products: 'product',
  services: 'service',
  spaces: 'space',
}

export type CatalogShareChannelResult = 'sent' | 'failed' | 'skipped'

export type CatalogShareResult = {
  email: CatalogShareChannelResult
  sms: CatalogShareChannelResult
}

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode })
}

async function assertCompanySessionAccess(userId: string, companyId: string): Promise<void> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) return

  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin' && membership?.role !== 'member') {
    throw httpError('Company access required', 403)
  }
}

async function resolveItemName(
  kind: CatalogKind,
  name: string | null,
  libraryEntityId: string | null,
): Promise<string> {
  const local = name?.trim()
  if (local) return local
  if (libraryEntityId) {
    const items = await listLibraryItemsByIds(kind, [libraryEntityId])
    const libraryName = items[0]?.name?.trim()
    if (libraryName) return libraryName
  }
  return 'Catalog item'
}

export async function sharePublishedCatalogItem(input: {
  userId: string
  companyId: string
  kind: CatalogEntityKind
  id: string
  email?: string
  phone?: string
}): Promise<CatalogShareResult> {
  await assertCompanySessionAccess(input.userId, input.companyId)

  if (!catalogRepo.isCatalogPricedKind(input.kind)) {
    throw httpError('Only products, services, and spaces can be shared', 400)
  }

  const row = await catalogRepo.findById(input.companyId, input.kind, input.id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }

  const item = catalogRepo.mapCatalogRow(input.kind, row)
  if (!('webPublishStatus' in item) || item.webPublishStatus !== 'published') {
    throw httpError('Only published catalog items can be shared', 400)
  }

  const company = await companyRepo.findCompanyById(input.companyId)
  const companyName = company?.name?.trim() || 'Company'
  const itemName = await resolveItemName(input.kind, item.name, item.libraryEntityId)
  const shareUrl = publicCatalogItemUrl(input.companyId, input.kind, input.id)
  const payload: Record<string, string> = {
    companyName,
    itemName,
    itemKind: ITEM_KIND_LABEL[input.kind],
    shareUrl,
  }

  const email: CatalogShareChannelResult = input.email
    ? (await sendTransactionalEmail({
        templateSlug: TEMPLATE_SLUG,
        toEmail: input.email,
        payload,
        companyId: input.companyId,
        requestedByService: 'webonone',
      }))
      ? 'sent'
      : 'failed'
    : 'skipped'

  const sms: CatalogShareChannelResult = input.phone
    ? (await sendTransactionalSms({
        templateSlug: TEMPLATE_SLUG,
        toNumber: input.phone,
        payload,
        companyId: input.companyId,
        requestedByService: 'webonone',
      }))
      ? 'sent'
      : 'failed'
    : 'skipped'

  return { email, sms }
}
