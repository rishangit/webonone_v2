import { useEffect } from 'react'
import type { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import type { CatalogFeatureState } from '@/shared/store/createCatalogFeatureStore'

type CatalogEditorActions = {
  fetchDetailRequested: ActionCreatorWithPayload<{ id: string; force?: boolean }>
  saveDetailRequested: ActionCreatorWithPayload<{ id?: string; body: Record<string, unknown> }>
  resetDetail: ActionCreatorWithPayload<void>
}

export function useEpicCatalogEditor<T>(
  id: string | undefined,
  isNew: boolean,
  selectState: (state: RootState) => CatalogFeatureState<T>,
  actions: CatalogEditorActions,
) {
  const dispatch = useAppDispatch()
  const featureState = useAppSelector(selectState)

  useEffect(() => {
    if (isNew || !id) {
      dispatch(actions.resetDetail())
      return
    }
    dispatch(actions.fetchDetailRequested({ id }))
  }, [actions, dispatch, id, isNew])

  const save = (body: Record<string, unknown>) => {
    dispatch(actions.saveDetailRequested({ id: isNew ? undefined : id, body }))
  }

  return {
    detail: featureState.detail,
    loading: featureState.detailStatus === 'loading',
    saving: featureState.detailStatus === 'saving',
    error: featureState.detailError,
    save,
  }
}
