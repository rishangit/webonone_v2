import { Platform } from 'react-native'
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin'
import { env } from '@/shared/config/env'

let configured = false

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in cancelled')
    this.name = 'GoogleSignInCancelledError'
  }
}

function ensureConfigured(): void {
  if (configured) return
  if (!env.googleWebClientId) {
    throw new Error('Google Sign-In is not configured')
  }
  GoogleSignin.configure({ webClientId: env.googleWebClientId })
  configured = true
}

/** True when the Google button should render (Android + Web client ID set). */
export function isGoogleSignInAvailable(): boolean {
  return Platform.OS === 'android' && Boolean(env.googleWebClientId)
}

/**
 * Native Google Sign-In → ID token for Identity `POST /auth/google`.
 * Throws {@link GoogleSignInCancelledError} when the user dismisses the picker.
 */
export async function getGoogleIdToken(): Promise<string> {
  if (!isGoogleSignInAvailable()) {
    throw new Error('Google Sign-In is only available on Android when configured')
  }

  ensureConfigured()

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    const response = await GoogleSignin.signIn()
    if (response.type === 'cancelled') {
      throw new GoogleSignInCancelledError()
    }
    const idToken = response.data?.idToken
    if (!idToken) {
      throw new Error('Google Sign-In did not return an ID token')
    }
    return idToken
  } catch (err) {
    if (err instanceof GoogleSignInCancelledError) throw err
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelledError()
    }
    if (err instanceof Error) throw err
    throw new Error('Google sign-in failed')
  }
}
