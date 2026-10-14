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
import { dispatchAiProductVariantsChanged } from '@/features/shell/utils/aiProductVariantsRefresh'

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
  if (match) {
    return match[1] as DataListResource
  }
  const attributeValueMatch = /^create_data_(product|service|space)_attribute_value$/.exec(toolName)
  if (attributeValueMatch) {
    return attributeValueMatch[1] as DataListResource
  }
  if (toolName === 'create_data_product_variant') {
    return 'product'
  }
  return null
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
      // Replace from page 1. On-scroll lists store the last appended page; refreshing
      // that page wipes earlier rows and leaves load-more looping on empty pages.
      dispatch(DATA_LIST_ACTIONS[resource].loadListRequested({ page: 1, force: true }))
      if (event.data.toolName === 'create_data_product_variant') {
        dispatchAiProductVariantsChanged()
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [dispatch])
}
