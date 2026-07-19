import {
  useEpicCatalogEditor as useEpicCatalogEditorBase,
  type CatalogFeatureState,
  type CatalogEditorActions,
} from '@webonone/store-kit'
import type { RootState } from '@/app/store'

export function useEpicCatalogEditor<T>(
  id: string | undefined,
  isNew: boolean,
  selectState: (state: RootState) => CatalogFeatureState<T>,
  actions: CatalogEditorActions,
) {
  return useEpicCatalogEditorBase<T, RootState>(id, isNew, selectState, actions)
}
