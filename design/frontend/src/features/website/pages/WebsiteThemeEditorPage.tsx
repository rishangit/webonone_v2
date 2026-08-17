import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { nanoid } from 'nanoid'
import {
  Button,
  Card,
  ColorInput,
  FeaturePage,
  FormField,
  Input,
  useToast,
} from '@webonone/ui-kit'
import { useAppDispatch, useAppSelector } from '@/app/store/hooks'
import { usePlatformLoading } from '@/features/auth/context/PlatformLoadingContext'
import { useNavigateDesign } from '@/features/shell/utils/navigateDesign'
import { websiteThemesActions } from '../store'
import type { WebsiteTheme } from '../types'

export function WebsiteThemeEditorPage() {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const { goToWebsite } = useNavigateDesign()
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const { detail, detailStatus, detailError } = useAppSelector((s) => s.websiteThemes)
  const [theme, setTheme] = useState<WebsiteTheme | null>(null)

  usePlatformLoading(detailStatus === 'loading' && !detail ? t('loading') : null)

  useEffect(() => {
    if (id) dispatch(websiteThemesActions.fetchDetailRequested({ id, force: true }))
  }, [dispatch, id])

  useEffect(() => {
    if (detail && detail.id === id) setTheme(detail)
  }, [detail, id])

  if (!accessToken) return <Navigate to="/login" replace />
  if (!id || !theme) {
    return (
      <FeaturePage title={t('themes')} onBack={() => goToWebsite('/website/themes')}>
        {detailError ? <p className="text-sm text-destructive">{detailError}</p> : null}
      </FeaturePage>
    )
  }

  function save() {
    if (!theme) return
    dispatch(
      websiteThemesActions.saveDetailRequested({
        id: theme.id,
        body: {
          name: theme.name,
          pageBackground: theme.pageBackground,
          bodyTextColor: theme.bodyTextColor,
          isActive: theme.isActive,
          isDefault: theme.isDefault,
          fonts: theme.fonts,
          colors: theme.colors,
          textStyles: theme.textStyles,
          buttonStyles: theme.buttonStyles,
        },
      }),
    )
    toast({ title: t('saved') })
  }

  return (
    <FeaturePage
      title={theme.name}
      onBack={() => goToWebsite('/website/themes')}
      actions={
        <Button type="button" onClick={save} disabled={detailStatus === 'saving'}>
          {detailStatus === 'saving' ? t('saving') : tc('save')}
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <FormField label={t('name')} htmlFor="theme-name" required>
            <Input id="theme-name" value={theme.name} onChange={(e) => setTheme({ ...theme, name: e.target.value })} />
          </FormField>
          <FormField label={t('pageBackground')} htmlFor="theme-page-bg">
            <ColorInput
              id="theme-page-bg"
              value={theme.pageBackground}
              onChange={(value) => setTheme({ ...theme, pageBackground: value })}
            />
          </FormField>
          <FormField label={t('bodyTextColor')} htmlFor="theme-body">
            <ColorInput
              id="theme-body"
              value={theme.bodyTextColor}
              onChange={(value) => setTheme({ ...theme, bodyTextColor: value })}
            />
          </FormField>
        </Card>
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{t('fonts')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTheme({
                  ...theme,
                  fonts: [...theme.fonts, { id: nanoid(8), name: 'Font', googleFontUrl: '', family: 'Inter' }],
                })
              }
            >
              {t('addFont')}
            </Button>
          </div>
          {theme.fonts.map((font, index) => (
            <div key={font.id} className="grid gap-2 sm:grid-cols-3">
              <Input
                value={font.name}
                onChange={(e) => {
                  const fonts = [...theme.fonts]
                  fonts[index] = { ...font, name: e.target.value }
                  setTheme({ ...theme, fonts })
                }}
              />
              <Input
                value={font.family}
                onChange={(e) => {
                  const fonts = [...theme.fonts]
                  fonts[index] = { ...font, family: e.target.value }
                  setTheme({ ...theme, fonts })
                }}
              />
              <Input
                value={font.googleFontUrl}
                placeholder={t('googleFontUrl')}
                onChange={(e) => {
                  const fonts = [...theme.fonts]
                  fonts[index] = { ...font, googleFontUrl: e.target.value }
                  setTheme({ ...theme, fonts })
                }}
              />
            </div>
          ))}
        </Card>
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{t('colors')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTheme({
                  ...theme,
                  colors: [...theme.colors, { id: nanoid(8), name: 'Color', value: '#111827' }],
                })
              }
            >
              {t('addColor')}
            </Button>
          </div>
          {theme.colors.map((color, index) => (
            <div key={color.id} className="grid gap-2 sm:grid-cols-2">
              <Input
                value={color.name}
                onChange={(e) => {
                  const colors = [...theme.colors]
                  colors[index] = { ...color, name: e.target.value }
                  setTheme({ ...theme, colors })
                }}
              />
              <ColorInput
                value={color.value}
                onChange={(value) => {
                  const colors = [...theme.colors]
                  colors[index] = { ...color, value }
                  setTheme({ ...theme, colors })
                }}
              />
            </div>
          ))}
        </Card>
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">{t('textStyles')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTheme({
                  ...theme,
                  textStyles: [
                    ...theme.textStyles,
                    { id: nanoid(8), name: 'Body', fontId: theme.fonts[0]?.id ?? '', size: 16, colorId: theme.colors[0]?.id ?? '' },
                  ],
                })
              }
            >
              {t('addTextStyle')}
            </Button>
          </div>
          {theme.textStyles.map((style, index) => (
            <div key={style.id} className="grid gap-2 sm:grid-cols-3">
              <Input
                value={style.name}
                onChange={(e) => {
                  const textStyles = [...theme.textStyles]
                  textStyles[index] = { ...style, name: e.target.value }
                  setTheme({ ...theme, textStyles })
                }}
              />
              <Input
                type="number"
                value={style.size}
                onChange={(e) => {
                  const textStyles = [...theme.textStyles]
                  textStyles[index] = { ...style, size: Number(e.target.value) || 16 }
                  setTheme({ ...theme, textStyles })
                }}
              />
              <Input
                value={style.fontId}
                onChange={(e) => {
                  const textStyles = [...theme.textStyles]
                  textStyles[index] = { ...style, fontId: e.target.value }
                  setTheme({ ...theme, textStyles })
                }}
              />
            </div>
          ))}
        </Card>
        <Card className="space-y-3 p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-medium">{t('buttonStyles')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTheme({
                  ...theme,
                  buttonStyles: [
                    ...theme.buttonStyles,
                    {
                      id: nanoid(8),
                      name: 'Primary',
                      backgroundColorId: theme.colors[0]?.id ?? '',
                      textColorId: theme.colors[1]?.id ?? theme.colors[0]?.id ?? '',
                      textStyleId: theme.textStyles[0]?.id ?? '',
                      borderColorId: '',
                      borderWidth: 0,
                      radius: 6,
                    },
                  ],
                })
              }
            >
              {t('addButtonStyle')}
            </Button>
          </div>
          {theme.buttonStyles.map((style, index) => (
            <div key={style.id} className="grid gap-2 sm:grid-cols-4">
              <Input
                value={style.name}
                onChange={(e) => {
                  const buttonStyles = [...theme.buttonStyles]
                  buttonStyles[index] = { ...style, name: e.target.value }
                  setTheme({ ...theme, buttonStyles })
                }}
              />
              <Input
                type="number"
                value={style.radius}
                onChange={(e) => {
                  const buttonStyles = [...theme.buttonStyles]
                  buttonStyles[index] = { ...style, radius: Number(e.target.value) || 0 }
                  setTheme({ ...theme, buttonStyles })
                }}
              />
              <Input
                value={style.backgroundColorId}
                onChange={(e) => {
                  const buttonStyles = [...theme.buttonStyles]
                  buttonStyles[index] = { ...style, backgroundColorId: e.target.value }
                  setTheme({ ...theme, buttonStyles })
                }}
              />
              <Input
                value={style.textStyleId}
                onChange={(e) => {
                  const buttonStyles = [...theme.buttonStyles]
                  buttonStyles[index] = { ...style, textStyleId: e.target.value }
                  setTheme({ ...theme, buttonStyles })
                }}
              />
            </div>
          ))}
        </Card>
      </div>
    </FeaturePage>
  )
}
