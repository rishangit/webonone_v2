export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  /** Preferred UI locale (`en` | `si`). */
  locale?: string | null
}
