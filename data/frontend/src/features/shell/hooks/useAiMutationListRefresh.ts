import { useEffect } from 'react'
import { isPlatformAiMutationMessage } from '@webonone/platform-embed'
import { useAppDispatch } from '@/app/store/hooks'
import { isAllowedParentOrigin } from '@/features/auth/utils/identityConfig'
import { attributesActions } from '@/features/attributes/store'
import { productsActions } from '@/features/products/store'
import { servicesActions } from '@/features/services/store'
import { spacesActions } from '@/features/spaces/store'
import { tagsActions } from '@/features/tags/store'
import { unitsActions } from '@/features/units/store'

const DATA_LIST_ACTIONS = {
  unit: unitsActions,
  tag: tagsActions,
  attribute: attributesActions,
  product: productsActions,
  service: servicesActions,
  space: spacesActions,
} as const

type DataListResource = keyof typeof DATA_LIST_ACTIONS

export function dataResourceForToolName(toolName: string): DataListResource | null {
  const match = /^(?:create|update|delete)_data_(unit|tag|attribute|product|service|space)$/.exec(
    toolName,
  )
  return match ? (match[1] as DataListResource) : null
}

/** Refetch the matching Data list after the WebOnOne assistant confirms a write. */
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
      const resource = dataResourceForToolName(event.data.toolName)
      if (!resource) {
        return
      }
      dispatch(DATA_LIST_ACTIONS[resource].loadListRequested({ force: true }))
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatch])
}
