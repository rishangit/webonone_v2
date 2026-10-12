import type { Request, Response } from 'express'
import { countLibraryEntityReferences } from '../repositories/companyCatalog.repository.js'
import type { LibraryEntityReferenceCountsBody } from '../schemas/internalLibraryReferences.schema.js'

export async function postLibraryEntityReferenceCounts(req: Request, res: Response) {
  const body = req.body as LibraryEntityReferenceCountsBody
  const counts = await countLibraryEntityReferences(body.kind, body.entityIds)
  res.json({ counts })
}
