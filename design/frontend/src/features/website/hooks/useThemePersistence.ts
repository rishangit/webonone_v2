import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { websiteThemeEditorSchema } from '../schemas/websiteThemeSchemas'
import { websiteThemesActions } from '../store'
import type { WebsiteTheme } from '../types'
import { mapThemeFieldErrors } from '../utils/mapThemeFieldErrors'
import { writeThemeDraft } from '../utils/themeDraftStorage'

export function useThemePersistence(theme: WebsiteTheme | null, onSynced: (theme: WebsiteTheme) => void) {
  const { t } = useTranslation('website')
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const [awaitingSave, setAwaitingSave] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!awaitingSave) return
    if (detailStatus === 'idle' && detail && theme && detail.id === theme.id) {
      setAwaitingSave(false)
      setFieldErrors({})
      toast({ title: t('saved') })
      onSynced(detail)
      writeThemeDraft(detail)
    }
    if (detailStatus === 'error') {
      setAwaitingSave(false)
      toast({
        title: t('saveFailed'),
        description: detailError ?? undefined,
        variant: 'destructive',
      })
      if (theme) dispatch(websiteThemesActions.fetchDetailRequested({ id: theme.id, force: true }))
    }
  }, [awaitingSave, detail, detailError, detailStatus, dispatch, onSynced, t, theme, toast])

  const persistTheme = useCallback(
    (next: WebsiteTheme) => {
      const parsed = websiteThemeEditorSchema.safeParse({
        name: next.name,
        pageBackground: next.pageBackground,
        bodyTextColor: next.bodyTextColor,
        fonts: next.fonts,
        colors: next.colors,
        textStyles: next.textStyles,
        buttonStyles: next.buttonStyles,
      })
      if (!parsed.success) {
        const errors = mapThemeFieldErrors(parsed.error.issues)
        setFieldErrors(errors)
        const firstMessage = Object.values(errors)[0]
        toast({
          title: t('saveFailed'),
          description: firstMessage,
          variant: 'destructive',
        })
        return false
      }
      setFieldErrors({})
      onSynced(next)
      writeThemeDraft(next)
      setAwaitingSave(true)
      dispatch(
        websiteThemesActions.saveDetailRequested({
          id: next.id,
          body: {
            name: parsed.data.name,
            pageBackground: parsed.data.pageBackground,
            bodyTextColor: parsed.data.bodyTextColor,
            isActive: next.isActive,
            isDefault: next.isDefault,
            fonts: parsed.data.fonts,
            colors: parsed.data.colors,
            textStyles: parsed.data.textStyles,
            buttonStyles: parsed.data.buttonStyles,
          },
        }),
      )
      return true
    },
    [dispatch, onSynced, t, toast],
  )

  return {
    persistTheme,
    saving: detailStatus === 'saving' || awaitingSave,
    fieldErrors,
  }
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(callback: T, delayMs: number): T {
  const callbackRef = useRef(callback)
  const timerRef = useRef<number | undefined>(undefined)
  callbackRef.current = callback

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return useCallback(
    ((...args: Parameters<T>) => {
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => callbackRef.current(...args), delayMs)
    }) as T,
    [delayMs],
  )
}
