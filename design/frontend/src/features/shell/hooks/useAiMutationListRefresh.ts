import { useEffect } from 'react'
import { isPlatformAiMutationMessage } from '@webonone/platform-embed'
import { useAppDispatch } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { websiteButtonLibraryActions, websiteTextLibraryActions } from '@/features/website/store'

const LIBRARY_LIST_ACTIONS = {
  button: websiteButtonLibraryActions,
  text: websiteTextLibraryActions,
} as const

type LibraryResource = keyof typeof LIBRARY_LIST_ACTIONS

export function libraryResourceForToolName(toolName: string): LibraryResource | null {
  const match = /^(?:create|update|delete)_design_(button|text)_library$/.exec(toolName)
  return match ? (match[1] as LibraryResource) : null
}

/** Refetch the matching website library list after the WebOnOne assistant confirms a write. */
export function useAiMutationListRefresh() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAllowedParentOrigin(event.origin)) {
        return
      }
      if (!isPlatformAiMutationMessage(event.data)) {
        return
      }
      const resource = libraryResourceForToolName(event.data.toolName)
      if (!resource) {
        return
      }
      dispatch(LIBRARY_LIST_ACTIONS[resource].loadListRequested({ page: 1, pageSize: 48, force: true }))
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatch])
}
