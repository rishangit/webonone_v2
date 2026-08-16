import { nanoid } from 'nanoid'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function issueGuestSession(secret = env.jwtSecret): { accessToken: string; expiresIn: number; guestId: string } {
  const guestId = nanoid()
  const expiresIn = env.guestTokenExpirySeconds
  const accessToken = jwt.sign(
    { sub: guestId, token_use: 'guest' },
    secret,
    {
      issuer: env.guestJwtIssuer,
      audience: env.guestJwtAudience,
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    },
  )
  return { accessToken, expiresIn, guestId }
}
