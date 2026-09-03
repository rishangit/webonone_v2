import type { Request, Response } from 'express'
import { db } from '../models/db.js'

export async function health(_req: Request, res: Response) {
  try {
    await db.raw('select 1')
    res.json({ status: 'ok', service: 'support', database: 'up' })
  } catch {
    res.status(503).json({ status: 'degraded', service: 'support', database: 'down' })
  }
}
