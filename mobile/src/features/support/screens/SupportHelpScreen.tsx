import { PeerWebViewScreen } from '@/features/peer/PeerWebViewScreen'
import { env } from '@/shared/config/env'

const supportFeedbackDestination = {
  kind: 'webview' as const,
  title: 'Help',
  origin: env.supportOrigin,
  path: '/feedback',
  storageKey: 'support_auth',
}

export function SupportHelpScreen() {
  return <PeerWebViewScreen destination={supportFeedbackDestination} />
}
