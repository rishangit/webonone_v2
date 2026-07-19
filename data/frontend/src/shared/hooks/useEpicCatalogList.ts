import {
  useEpicCatalogList as useEpicCatalogListBase,
  type CatalogFeatureState,
  type CatalogListActions,
} from '@webonone/store-kit'
import type { RootState } from '@/app/store'

export function useEpicCatalogList<T>(
  selectState: (state: RootState) => CatalogFeatureState<T>,
  actions: CatalogListActions,
) {
  return useEpicCatalogListBase<T, RootState>(selectState, actions)
}
