import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription, FeaturePage } from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { ThemeColorPaletteEditDialog } from '../components/ThemeColorPaletteEditDialog'
import {
  ThemeColorPaletteItemEditor,
  type ThemeColorPaletteEditSection,
} from '../components/ThemeColorPaletteItemEditor'
import { useThemePersistence } from '../hooks/useThemePersistence'
import { websiteThemesActions } from '../store'
import type { WebsiteColorToken, WebsiteTheme } from '../types'
import { applyThemeChrome, themePaletteToLibraryPalette } from '../utils/websitePalette'
import { writeThemeDraft } from '../utils/themeDraftStorage'

export function WebsiteThemeColorPaletteDetailPage() {
  const { themeId = '', paletteId = '' } = useParams<{ themeId: string; paletteId: string }>()
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { detail, detailStatus } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)
  const [editSection, setEditSection] = useState<ThemeColorPaletteEditSection | null>(null)

  const { persistTheme } = useThemePersistence(theme, setTheme)

  useEffect(() => {
    if (themeId) dispatch(websiteThemesActions.fetchDetailRequested({ id: themeId, force: true }))
  }, [dispatch, themeId])

  useEffect(() => {
    if (detail?.id === themeId) {
      const next = { ...detail, colorPalettes: detail.colorPalettes ?? [] }
      setTheme(next)
      writeThemeDraft(next)
    }
  }, [detail, themeId])

  const paletteRef = useMemo(
    () => theme?.colorPalettes.find((entry) => entry.id === paletteId) ?? null,
    [paletteId, theme?.colorPalettes],
  )

  const palette = useMemo(
    () => (paletteRef ? themePaletteToLibraryPalette(paletteRef) : null),
    [paletteRef],
  )

  const paletteColorDrafts = useMemo(() => {
    if (!paletteRef) return []
    return paletteRef.colors.map((color, index) => ({
      id: String(index + 1),
      name: color.name,
      value: color.value,
    }))
  }, [paletteRef])

  if (!accessToken) return <Navigate to="/login" replace />

  const backPath = `/website/themes/${themeId}`

  if (!theme || !paletteRef || !palette) {
    return (
      <FeaturePage title={t('themeColorPaletteDetailTitle')} onBack={() => goToWebsite(backPath)} backLabel={tc('back')}>
        {detailStatus === 'error' ? (
          <Alert variant="destructive">
            <AlertDescription>{t('loading')}</AlertDescription>
          </Alert>
        ) : null}
      </FeaturePage>
    )
  }

  function saveOverview(name: string) {
    if (!theme) return
    persistTheme({
      ...theme,
      colorPalettes: theme.colorPalettes.map((entry) =>
        entry.id === paletteId ? { ...entry, name } : entry,
      ),
    })
  }

  function saveColors(nextColors: WebsiteColorToken[]) {
    if (!theme) return
    persistTheme(
      applyThemeChrome({
        ...theme,
        colorPalettes: theme.colorPalettes.map((entry) =>
          entry.id === paletteId
            ? { ...entry, colors: nextColors.map((color) => ({ name: color.name, value: color.value })) }
            : entry,
        ),
      }),
    )
  }

  return (
    <FeaturePage
      title={paletteRef.name}
      description={t('themeColorPaletteDetailDescription')}
      onBack={() => goToWebsite(backPath)}
      backLabel={tc('back')}
    >
      <ThemeColorPaletteItemEditor name={paletteRef.name} palette={palette} onEdit={setEditSection} />
      <ThemeColorPaletteEditDialog
        open={editSection !== null}
        section={editSection}
        paletteName={paletteRef.name}
        colors={paletteColorDrafts}
        takenColorValues={theme.colorPalettes.flatMap((entry) => entry.colors.map((color) => color.value))}
        onOpenChange={(open) => {
          if (!open) setEditSection(null)
        }}
        onSaveOverview={saveOverview}
        onSaveColors={saveColors}
      />
    </FeaturePage>
  )
}
