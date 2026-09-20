import { useTranslation } from 'react-i18next'
import { ColorInput, FormField, Select, SelectContent, SelectItem, SelectTrigger } from '@webonone/mobile-ui'
import type {
  ElementBorderRadius,
  ElementBoxShadow,
  ElementChrome,
  ElementMargin,
  ElementPadding,
} from '@/features/design/website/types'

const RADIUS: ElementBorderRadius[] = ['sm', 'md', 'lg', 'xl', 'full']
const SHADOW: ElementBoxShadow[] = ['sm', 'md', 'lg']
const PADDING: ElementPadding[] = [1, 2, 3]
const MARGIN: ElementMargin[] = [1, 2, 3, 4]

export function ElementChromeFields({
  value,
  disabled,
  onChange,
}: {
  value: ElementChrome
  disabled?: boolean
  onChange: (next: ElementChrome) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')

  return (
    <>
      <ColorInput
        label={t('background')}
        value={value.backgroundColor ?? ''}
        onChange={(backgroundColor) => onChange({ ...value, backgroundColor: backgroundColor || undefined })}
        disabled={disabled}
      />
      <ColorInput
        label={t('borderColor')}
        value={value.borderColor ?? ''}
        onChange={(borderColor) => onChange({ ...value, borderColor: borderColor || undefined })}
        disabled={disabled}
      />
      <FormField label={t('borderRadius')}>
        <Select
          value={value.borderRadius ?? 'none'}
          onValueChange={(borderRadius) =>
            onChange({
              ...value,
              borderRadius: borderRadius === 'none' ? undefined : (borderRadius as ElementBorderRadius),
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{t('spacingNone')}</SelectItem>
            {RADIUS.map((item) => (
              <SelectItem key={item} value={item}>
                {t(`chromeRadius.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('boxShadow')}>
        <Select
          value={value.boxShadow ?? 'none'}
          onValueChange={(boxShadow) =>
            onChange({
              ...value,
              boxShadow: boxShadow === 'none' ? undefined : (boxShadow as ElementBoxShadow),
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{t('spacingNone')}</SelectItem>
            {SHADOW.map((item) => (
              <SelectItem key={item} value={item}>
                {t(`chromeShadow.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('padding')}>
        <Select
          value={value.padding ? String(value.padding) : 'none'}
          onValueChange={(padding) =>
            onChange({
              ...value,
              padding: padding === 'none' ? undefined : (Number(padding) as ElementPadding),
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{t('spacingNone')}</SelectItem>
            {PADDING.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {String(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label={t('margin')}>
        <Select
          value={value.margin ? String(value.margin) : 'none'}
          onValueChange={(margin) =>
            onChange({
              ...value,
              margin: margin === 'none' ? undefined : (Number(margin) as ElementMargin),
            })
          }
        >
          <SelectTrigger />
          <SelectContent>
            <SelectItem value="none">{tc('none')}</SelectItem>
            {MARGIN.map((item) => (
              <SelectItem key={item} value={String(item)}>
                {String(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  )
}
