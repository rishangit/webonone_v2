import { OAuth2Client } from 'google-auth-library'
import { nanoid } from 'nanoid'
import {
  createUser,
  findUserByEmail,
  findUserByGoogleSub,
  linkGoogleAccount,
  syncGoogleProfile,
} from '../models/user.repository.js'
import { AuthError, issueAuthTokens } from './auth.service.js'
import { env } from '../config/env.js'

interface GoogleTokenPayload {
  sub: string
  email: string
  email_verified?: boolean
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
  locale?: string
}

interface GoogleUserInfo {
  sub?: string
  email?: string
  email_verified?: boolean | string
  given_name?: string
  family_name?: string
  name?: string
  picture?: string
  locale?: string
}

function getGoogleClient() {
  if (!env.googleClientId) {
    throw new AuthError('Google Sign-In is not configured', 503, 'GOOGLE_NOT_CONFIGURED')
  }
  return new OAuth2Client(env.googleClientId)
}

function isOurGoogleClient(audience: string | undefined, authorizedParty: string | undefined) {
  return audience === env.googleClientId || authorizedParty === env.googleClientId
}

function asVerifiedFlag(value: boolean | string | undefined) {
  return value === true || value === 'true'
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const client = getGoogleClient()
  let ticket
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    })
  } catch {
    throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
  }

  const payload = ticket.getPayload() as GoogleTokenPayload | undefined
  if (!payload?.sub || !payload.email) {
    throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
  }
  return payload
}

async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleTokenPayload> {
  const client = getGoogleClient()
  let tokenInfo
  try {
    tokenInfo = await client.getTokenInfo(accessToken)
  } catch {
    throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
  }

  if (!isOurGoogleClient(tokenInfo.aud, tokenInfo.azp)) {
    throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
  }

  const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!userinfoRes.ok) {
    throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
  }

  const userinfo = (await userinfoRes.json()) as GoogleUserInfo
  const sub = userinfo.sub || tokenInfo.sub
  const email = userinfo.email || tokenInfo.email
  if (!sub || !email) {
    throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
  }

  return {
    sub,
    email,
    email_verified: asVerifiedFlag(userinfo.email_verified ?? tokenInfo.email_verified),
    given_name: userinfo.given_name,
    family_name: userinfo.family_name,
    name: userinfo.name,
    picture: userinfo.picture,
    locale: userinfo.locale,
  }
}

async function issueSessionForGoogleProfile(payload: GoogleTokenPayload) {
  const firstName = payload.given_name ?? payload.name?.split(' ')[0] ?? 'User'
  const lastName =
    payload.family_name ?? payload.name?.split(' ').slice(1).join(' ') ?? ''
  const displayName = payload.name ?? `${firstName} ${lastName}`.trim()

  let user = await findUserByGoogleSub(payload.sub)

  if (user) {
    user = await syncGoogleProfile(user.id, {
      firstName,
      lastName,
      displayName,
      avatarUrl: payload.picture ?? null,
      locale: payload.locale ?? null,
      isEmailVerified: payload.email_verified ?? false,
    })
  } else {
    const byEmail = await findUserByEmail(payload.email)
    if (byEmail) {
      user = await linkGoogleAccount(byEmail.id, {
        googleSub: payload.sub,
        firstName: byEmail.first_name || firstName,
        lastName: byEmail.last_name || lastName,
        displayName: byEmail.display_name || displayName,
        avatarUrl: payload.picture ?? null,
        locale: payload.locale ?? null,
        isEmailVerified: payload.email_verified ?? false,
      })
    } else {
      user = await createUser({
        id: nanoid(),
        email: payload.email,
        googleSub: payload.sub,
        displayName,
        firstName,
        lastName,
        isEmailVerified: payload.email_verified ?? false,
        avatarUrl: payload.picture ?? null,
        locale: payload.locale ?? null,
      })
    }
  }

  return issueAuthTokens(user!)
}

export async function loginWithGoogle(input: { idToken?: string; accessToken?: string }) {
  if (input.idToken) {
    return issueSessionForGoogleProfile(await verifyGoogleIdToken(input.idToken))
  }
  if (input.accessToken) {
    return issueSessionForGoogleProfile(await verifyGoogleAccessToken(input.accessToken))
  }
  throw new AuthError('Invalid Google token', 401, 'INVALID_GOOGLE_TOKEN')
}
