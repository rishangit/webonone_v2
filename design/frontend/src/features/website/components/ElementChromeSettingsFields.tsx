import { useTranslation } from 'react-i18next'
import {
  ColorInput,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@webonone/ui-kit'
import { chromeClassName, chromeInlineStyle, MARGIN_PX } from '../document/chrome'
import type {
  ElementBorderRadius,
  ElementBoxShadow,
  ElementChrome,
  ElementMargin,
  ElementPadding,
} from '../types'

const NONE = '__none__'

const RADIUS_OPTIONS: ElementBorderRadius[] = ['sm', 'md', 'lg', 'xl', 'full']
const SHADOW_OPTIONS: ElementBoxShadow[] = ['sm', 'md', 'lg']
const PADDING_OPTIONS: ElementPadding[] = [1, 2, 3]
const MARGIN_OPTIONS: ElementMargin[] = [1, 2, 3, 4]

interface ElementChromeSettingsFieldsProps {
  value: ElementChrome
  onChange: (next: ElementChrome) => void
  fieldErrors?: Partial<Record<string, string>>
  idPrefix?: string
}

export function ElementChromeSettingsFields({
  value,
  onChange,
  fieldErrors = {},
  idPrefix = 'element-chrome',
}: ElementChromeSettingsFieldsProps) {
  const { t } = useTranslation('website')

  function patch(partial: Partial<ElementChrome>) {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label={t('background')} htmlFor={`${idPrefix}-bg`} error={fieldErrors.backgroundColor}>
          <ColorInput
            id={`${idPrefix}-bg`}
            value={value.backgroundColor ?? ''}
            onChange={(backgroundColor) => patch({ backgroundColor: backgroundColor || undefined })}
          />
        </FormField>
        <FormField label={t('borderColor')} htmlFor={`${idPrefix}-border`} error={fieldErrors.borderColor}>
          <ColorInput
            id={`${idPrefix}-border`}
            value={value.borderColor ?? ''}
            onChange={(borderColor) => patch({ borderColor: borderColor || undefined })}
          />
        </FormField>
        <FormField label={t('borderRadius')} htmlFor={`${idPrefix}-radius`} error={fieldErrors.borderRadius}>
          <Select
            value={value.borderRadius ?? NONE}
            onValueChange={(next) =>
              patch({ borderRadius: next === NONE ? undefined : (next as ElementBorderRadius) })
            }
          >
            <SelectTrigger id={`${idPrefix}-radius`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {RADIUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`chromeRadius.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('boxShadow')} htmlFor={`${idPrefix}-shadow`} error={fieldErrors.boxShadow}>
          <Select
            value={value.boxShadow ?? NONE}
            onValueChange={(next) =>
              patch({ boxShadow: next === NONE ? undefined : (next as ElementBoxShadow) })
            }
          >
            <SelectTrigger id={`${idPrefix}-shadow`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {SHADOW_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`chromeShadow.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('padding')} htmlFor={`${idPrefix}-padding`} error={fieldErrors.padding}>
          <Select
            value={value.padding != null ? String(value.padding) : NONE}
            onValueChange={(next) =>
              patch({ padding: next === NONE ? undefined : (Number(next) as ElementPadding) })
            }
          >
            <SelectTrigger id={`${idPrefix}-padding`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {PADDING_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={t('margin')} htmlFor={`${idPrefix}-margin`} error={fieldErrors.margin}>
          <Select
            value={value.margin != null ? String(value.margin) : NONE}
            onValueChange={(next) =>
              patch({ margin: next === NONE ? undefined : (Number(next) as ElementMargin) })
            }
          >
            <SelectTrigger id={`${idPrefix}-margin`}>
              <SelectValue placeholder={t('spacingNone')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t('spacingNone')}</SelectItem>
              {MARGIN_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <div
        className={cn(
          'w-full border border-dashed border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] p-4',
          chromeClassName({
            borderRadius: value.borderRadius,
            boxShadow: value.boxShadow,
            padding: value.padding,
          }),
        )}
        style={{
          ...chromeInlineStyle(value),
          ...(value.margin != null
            ? { margin: MARGIN_PX[value.margin], width: `calc(100% - ${2 * MARGIN_PX[value.margin]}px)` }
            : undefined),
        }}
      >
        <p className="text-sm text-muted-foreground">{t('colorPreview')}</p>
      </div>
    </div>
  )
}
