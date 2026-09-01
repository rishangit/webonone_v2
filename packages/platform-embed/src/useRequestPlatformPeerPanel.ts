import {
  useRequestPlatformPeerDialog,
  type UseRequestPlatformPeerDialogOptions,
  type UseRequestPlatformPeerDialogResult,
} from './useRequestPlatformPeerDialog'

export type UseRequestPlatformPeerPanelOptions = Omit<
  UseRequestPlatformPeerDialogOptions,
  'variant' | 'sizeWidth' | 'sizeHeight'
>

export type UseRequestPlatformPeerPanelResult = UseRequestPlatformPeerDialogResult

/**
 * When embedded in WebOnOne, open a core-hosted right slide panel instead of a local ListFilterPanel.
 */
export function useRequestPlatformPeerPanel(
  options: UseRequestPlatformPeerPanelOptions,
): UseRequestPlatformPeerPanelResult {
  return useRequestPlatformPeerDialog({
    ...options,
    variant: 'panel',
    sizeWidth: 'auto',
    sizeHeight: 'auto',
  })
}
