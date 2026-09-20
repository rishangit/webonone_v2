import { PeerWebViewScreen } from '@/features/peer/PeerWebViewScreen'
import { resolvePeerDestination } from '@/features/peer/peerDestinations'
import { useLocalSearchParams } from 'expo-router'

export function CatchAllScreen() {
  const params = useLocalSearchParams<{ path?: string | string[] }>()
  const segments = Array.isArray(params.path) ? params.path : params.path ? [params.path] : []
  const pathname = `/${segments.join('/')}`
  return <PeerWebViewScreen destination={resolvePeerDestination(pathname)} />
}
