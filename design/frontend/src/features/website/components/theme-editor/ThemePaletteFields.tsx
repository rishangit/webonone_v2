import { Minus } from 'lucide-react'
import { ColorInput, FormField, ListAddButton } from '@webonone/ui-kit'
import { useTranslation } from 'react-i18next'
import type { WebsiteColorToken } from '../../types'
import {
  WEBSITE_PALETTE_MAX,
  WEBSITE_PALETTE_MIN,
  WEBSITE_PALETTE_SLOT_NAME_KEYS,
} from '../../utils/websitePalette'

export function ThemePaletteFields({
  slots,
  disabled,
  onChange,
  onAdd,
  onRemove,
}: {
  slots: WebsiteColorToken[]
  disabled?: boolean
  onChange: (id: string, value: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation('website')
  const { t: tc } = useTranslation('common')
  const canRemove = slots.length > WEBSITE_PALETTE_MIN
  const canAdd = slots.length < WEBSITE_PALETTE_MAX

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{t('palette')}</p>
        <ListAddButton compactLabel={tc('add')} compactOnMobile={false} disabled={disabled || !canAdd} onClick={onAdd}>
          {t('addColor')}
        </ListAddButton>
      </div>
      <p className="text-sm text-muted-foreground">{t('paletteHint')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {slots.map((slot, index) => {
          const label = t(WEBSITE_PALETTE_SLOT_NAME_KEYS[index] ?? 'color')
          return (
            <div key={slot.id} className="flex items-end gap-2">
              <FormField className="min-w-0 flex-1" label={label} htmlFor={`website-theme-${slot.id}`} required>
                <ColorInput
                  id={`website-theme-${slot.id}`}
                  value={slot.value}
                  disabled={disabled}
                  onChange={(value) => onChange(slot.id, value)}
                />
              </FormField>
              {canRemove ? (
                <button
                  type="button"
                  className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  disabled={disabled}
                  aria-label={t('removePaletteColor', { name: label })}
                  onClick={() => onRemove(slot.id)}
                >
                  <Minus className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
