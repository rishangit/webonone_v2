import { db } from '../models/db.js'
import type { ReplaceServiceSpacesBody } from '../schemas/catalog.schema.js'

export interface ServiceSpaceDto {
  id: string
  name: string
  description: string | null
  status: string
  sortOrder: number
}

export async function listServiceSpaces(serviceId: string): Promise<ServiceSpaceDto[]> {
  const service = await db('data_services').where({ id: serviceId }).first('id')
  if (!service) throw new Error('NOT_FOUND')

  const rows = await db('data_service_spaces as link')
    .join('data_spaces as space', 'space.id', 'link.space_id')
    .where('link.service_id', serviceId)
    .orderBy('link.sort_order', 'asc')
    .select(
      'space.id',
      'space.name',
      'space.description',
      'space.status',
      'link.sort_order',
    )

  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    status: row.status as string,
    sortOrder: Number(row.sort_order),
  }))
}

export async function replaceServiceSpaces(
  serviceId: string,
  body: ReplaceServiceSpacesBody,
): Promise<ServiceSpaceDto[]> {
  const service = await db('data_services').where({ id: serviceId }).first('id')
  if (!service) throw new Error('NOT_FOUND')

  const nextIds = [...new Set(body.space_ids)]
  if (nextIds.length > 0) {
    const found = await db('data_spaces').whereIn('id', nextIds).select('id')
    if (found.length !== nextIds.length) throw new Error('NOT_FOUND')
  }

  await db.transaction(async (trx) => {
    await trx('data_service_spaces').where({ service_id: serviceId }).delete()
    if (nextIds.length > 0) {
      await trx('data_service_spaces').insert(
        nextIds.map((space_id, sort_order) => ({
          service_id: serviceId,
          space_id,
          sort_order,
        })),
      )
    }
    await trx('data_services').where({ id: serviceId }).update({ updated_at: trx.fn.now(3) })
  })

  return listServiceSpaces(serviceId)
}
