import { nanoid } from 'nanoid'
import { ZodError } from 'zod'
import * as roleRepo from '../clients/identityRoleClient.js'
import * as repo from '../repositories/companyCatalog.repository.js'
import {
  catalogEntityKindSchema,
  isCatalogGalleryKind,
  parsePartialPayloadForKind,
  parsePayloadForKind,
  type CatalogEntityKind,
  type CatalogPayload,
} from '../schemas/companyCatalogSchemas.js'

function httpError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

function parseOrBadRequest<T>(fn: () => T): T {
  try {
    return fn()
  } catch (err) {
    if (err instanceof ZodError) {
      throw httpError('Validation failed', 400)
    }
    throw err
  }
}

async function assertCompanyAdmin(userId: string, companyId: string): Promise<void> {
  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin') {
    throw httpError('Company admin access required', 403)
  }
}

/** Company owner or staff (member) with an Identity role for this company; super admin may read. */
async function assertCompanySessionAccess(userId: string, companyId: string): Promise<void> {
  const superAdmin = await roleRepo.findSuperAdminByUserId(userId)
  if (superAdmin) return

  const membership = await roleRepo.findCompanyRole(userId, companyId)
  if (membership?.role !== 'company_admin' && membership?.role !== 'member') {
    throw httpError('Company access required', 403)
  }
}

function toDto(kind: CatalogEntityKind, row: Record<string, unknown>) {
  return repo.mapCatalogRow(kind, row)
}

export function parseKindParam(kind: string): CatalogEntityKind {
  const parsed = catalogEntityKindSchema.safeParse(kind)
  if (!parsed.success) {
    throw httpError('Invalid catalog kind', 400)
  }
  return parsed.data
}

export async function listCatalogItems(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  options?: { q?: string },
) {
  await assertCompanySessionAccess(userId, companyId)
  const rows = await repo.listByCompanyAndKind(companyId, kind, options)
  return rows.map((row) => toDto(kind, row))
}

export async function getCatalogItem(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
) {
  await assertCompanySessionAccess(userId, companyId)
  const row = await repo.findById(companyId, kind, id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  return toDto(kind, row)
}

export async function linkFromLibrary(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  libraryEntityId: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const existing = await repo.findByLibraryId(companyId, kind, libraryEntityId)
  if (existing) {
    throw httpError('Library item already added to this company', 409)
  }
  const row = await repo.insertItem({
    id: nanoid(),
    companyId,
    entityKind: kind,
    bindingMode: 'linked',
    libraryEntityId,
    payload: null,
  })
  return toDto(kind, row)
}

export async function createFromLibrary(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  input: {
    libraryEntityId: string
    mode: 'linked' | 'forked'
    payload?: unknown
  },
) {
  await assertCompanyAdmin(userId, companyId)
  const existing = await repo.findByLibraryId(companyId, kind, input.libraryEntityId)
  if (existing) {
    throw httpError('Library item already added to this company', 409)
  }

  if (input.mode === 'linked') {
    const row = await repo.insertItem({
      id: nanoid(),
      companyId,
      entityKind: kind,
      bindingMode: 'linked',
      libraryEntityId: input.libraryEntityId,
      payload: null,
    })
    return toDto(kind, row)
  }

  const payload = parseOrBadRequest(() => parsePayloadForKind(kind, input.payload))
  const row = await repo.insertItem({
    id: nanoid(),
    companyId,
    entityKind: kind,
    bindingMode: 'forked',
    libraryEntityId: input.libraryEntityId,
    payload,
  })
  return toDto(kind, row)
}

export async function createCustom(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  payloadInput: unknown,
) {
  await assertCompanyAdmin(userId, companyId)
  const payload = parseOrBadRequest(() => parsePayloadForKind(kind, payloadInput))
  const row = await repo.insertItem({
    id: nanoid(),
    companyId,
    entityKind: kind,
    bindingMode: 'custom',
    libraryEntityId: null,
    payload,
  })
  return toDto(kind, row)
}

export async function forkCatalogItem(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
  payloadInput: unknown,
  galleryImages?: { mediaId: string; url: string }[],
) {
  await assertCompanyAdmin(userId, companyId)
  const row = await repo.findById(companyId, kind, id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  if (row.binding_mode !== 'linked') {
    throw httpError('Only linked items can be customized', 409)
  }
  const payload = parseOrBadRequest(() => parsePayloadForKind(kind, payloadInput))
  const updated = await repo.updateItem(companyId, kind, id, {
    bindingMode: 'forked',
    payload,
  })
  if (!updated) {
    throw httpError('Catalog item not found', 404)
  }

  // Snapshot effective gallery when still inheriting (null), so images are not lost.
  if (
    isCatalogGalleryKind(kind) &&
    updated.gallery_images == null &&
    galleryImages !== undefined
  ) {
    const withGallery = await repo.updateGalleryImages(companyId, kind, id, galleryImages)
    if (withGallery) {
      return toDto(kind, withGallery)
    }
  }

  return toDto(kind, updated)
}

export async function updateCatalogItem(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
  payloadInput: unknown,
) {
  await assertCompanyAdmin(userId, companyId)
  const row = await repo.findById(companyId, kind, id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  if (row.binding_mode === 'linked') {
    throw httpError('Linked items are read-only; customize first', 409)
  }
  const current = toDto(kind, row).payload as CatalogPayload
  const nextPayload = parseOrBadRequest(() =>
    parsePartialPayloadForKind(kind, payloadInput, current),
  )
  const updated = await repo.updateItem(companyId, kind, id, {
    payload: nextPayload,
  })
  if (!updated) {
    throw httpError('Catalog item not found', 404)
  }
  return toDto(kind, updated)
}

export async function updateCatalogGallery(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
  galleryImages: { mediaId: string; url: string }[],
) {
  await assertCompanyAdmin(userId, companyId)
  if (!isCatalogGalleryKind(kind)) {
    throw httpError('Gallery is only supported for products, services, and spaces', 400)
  }
  const row = await repo.findById(companyId, kind, id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  const updated = await repo.updateGalleryImages(companyId, kind, id, galleryImages)
  if (!updated) {
    throw httpError('Catalog item not found', 404)
  }
  return toDto(kind, updated)
}

export async function updateCatalogPricing(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
  listPrice: number | null,
) {
  await assertCompanyAdmin(userId, companyId)
  if (!repo.isCatalogPricedKind(kind)) {
    throw httpError('List price is only supported for products, services, and spaces', 400)
  }
  const row = await repo.findById(companyId, kind, id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  const updated = await repo.updateListPrice(companyId, kind, id, listPrice)
  if (!updated) {
    throw httpError('Catalog item not found', 404)
  }
  return toDto(kind, updated)
}

export async function updateServiceFormTemplate(
  userId: string,
  companyId: string,
  id: string,
  formTemplateId: string | null,
) {
  await assertCompanyAdmin(userId, companyId)
  const row = await repo.findById(companyId, 'services', id)
  if (!row) {
    throw httpError('Catalog item not found', 404)
  }
  const updated = await repo.updateServiceFormTemplate(companyId, id, formTemplateId)
  if (!updated) {
    throw httpError('Catalog item not found', 404)
  }
  return toDto('services', updated)
}

export async function listServicesWithLinkedForm(userId: string, companyId: string) {
  await assertCompanySessionAccess(userId, companyId)
  const rows = await repo.listServicesWithForm(companyId)
  return rows.map((row) => toDto('services', row))
}

export async function deleteCatalogItem(
  userId: string,
  companyId: string,
  kind: CatalogEntityKind,
  id: string,
) {
  await assertCompanyAdmin(userId, companyId)
  const deleted = await repo.deleteItem(companyId, kind, id)
  if (deleted === 0) {
    throw httpError('Catalog item not found', 404)
  }
}
