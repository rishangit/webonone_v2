export type GatewayMode = 'mobile_device' | 'text_lk'

export interface GatewayConfig {
  mode: GatewayMode
  senderId: string | null
  hasApiToken: boolean
  configured: boolean
  updatedAt: string | null
}
