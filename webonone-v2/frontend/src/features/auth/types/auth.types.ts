export interface UserProfile {
  id: string
  email: string
  displayName: string
}

export interface AuthPostMessageSuccess {
  type: 'webonone:auth:success'
  accessToken: string
  expiresIn: number
  user: UserProfile
}

export interface AuthPostMessageCancel {
  type: 'webonone:auth:cancel'
}

export type AuthPostMessage = AuthPostMessageSuccess | AuthPostMessageCancel
