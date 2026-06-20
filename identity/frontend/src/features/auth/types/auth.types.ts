export interface UserProfile {
  id: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateRegion: string | null
  postalCode: string | null
  country: string | null
  avatarUrl: string | null
  locale: string | null
  isEmailVerified: boolean
  isGoogleUser: boolean
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  displayName?: string
  phoneNumber?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  stateRegion?: string | null
  postalCode?: string | null
  country?: string | null
  avatarUrl?: string | null
  locale?: string | null
}

export interface AuthSuccessPayload {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserProfile
}

export interface ExchangeAuthPayload {
  accessToken: string
  expiresIn: number
  user: UserProfile
}
