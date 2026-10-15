import { nanoid } from 'nanoid'
import * as catalogRepo from '../repositories/companyCatalog.repository.js'
import { resolveCompanyVariant } from '../repositories/companyCatalogCopies.repository.js'
import * as limitsRepo from '../repositories/companyProductVariantStockLimits.repository.js'
import * as roleRepo from '../clients/identityRoleClient.js'

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

async function assertCompanySessionAccess(userId: string, companyId: string): Promise<void> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) return
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin' && membership?.role !== 'member') {
    throw httpError('Company access required', 403)
  }
}

async function assertCompanyAdmin(userId: string, companyId: string): Promise<void> {
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin') {
    throw httpError('Company admin access required', 403)
  }
}

async function assertCompanyProduct(companyId: string, companyProductId: string) {
  const row = await catalogRepo.findById(companyId, 'products', companyProductId)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  return row
}

export async function listProductVariantStockLimits(
  userId: string,
  companyId: string,
  companyProductId: string,
) {
  await assertCompanySessionAccess(userId, companyId)
  await assertCompanyProduct(companyId, companyProductId)
  const rows = await limitsRepo.listVariantStockLimitsForProduct(companyProductId)
  return { items: rows.map((row) => limitsRepo.mapVariantStockLimitsRow(row)) }
}

export async function getProductVariantStockLimits(
  userId: string,
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
) {
  await assertCompanySessionAccess(userId, companyId)
  await assertCompanyProduct(companyId, companyProductId)
  const resolved = await resolveCompanyVariant(companyProductId, libraryVariantId)
  const row = await limitsRepo.findVariantStockLimits(companyProductId, resolved.libraryVariantId)
  if (!row) {
    return {
      libraryVariantId: resolved.libraryVariantId,
      companyVariantId: resolved.companyVariantId,
      minQuantity: null,
      maxQuantity: null,
    }
  }
  return limitsRepo.mapVariantStockLimitsRow(row)
}

export async function upsertProductVariantStockLimits(
  userId: string,
  companyId: string,
  companyProductId: string,
  libraryVariantId: string,
  minQuantity: number | null,
  maxQuantity: number | null,
) {
  await assertCompanyAdmin(userId, companyId)
  await assertCompanyProduct(companyId, companyProductId)
  const resolved = await resolveCompanyVariant(companyProductId, libraryVariantId)
  const row = await limitsRepo.upsertVariantStockLimits({
    id: nanoid(),
    companyId,
    companyProductId,
    libraryVariantId: resolved.libraryVariantId,
    companyVariantId: resolved.companyVariantId,
    minQuantity,
    maxQuantity,
  })
  if (!row) {
    return {
      libraryVariantId: resolved.libraryVariantId,
      companyVariantId: resolved.companyVariantId,
      minQuantity: null,
      maxQuantity: null,
    }
  }
  return limitsRepo.mapVariantStockLimitsRow(row)
}
