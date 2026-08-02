import type { Request, Response } from 'express'
import { findUserById, toUserProfile } from '../models/user.repository.js'

/** Service-to-service contact lookup for notification senders (WebOnOne, etc.). */
export async function getUserContactInternal(req: Request, res: Response) {
  const userId = String(req.params.userId)
  const user = await findUserById(userId)
  if (!user) {
    res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' })
    return
  }

  const profile = toUserProfile(user)
  res.json({
    id: profile.id,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    displayName: profile.displayName,
  })
}
