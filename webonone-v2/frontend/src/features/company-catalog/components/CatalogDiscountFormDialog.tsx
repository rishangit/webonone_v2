import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  DatePicker,
  Form,
  FormField,
  Input,
  RadioGroup,
  RadioGroupItem,
  UserSelectionDialog,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  catalogDiscountSchemaFor,
  EMPTY_DISCOUNT_FORM,
  toDiscountBody,
  type CatalogDiscountFormState,
} from '@/features/company-catalog/schemas/catalogPricingSchemas'
import type {
  CatalogDiscount,
  CatalogDiscountKind,
  CatalogDiscountUser,
} from '@/features/company-catalog/types/catalogPricing.types'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'
import {
  OptionSelectionDialog,
  type LoadSelectionOptionsFn,
  type SelectionOption,
} from '@/shared/components/OptionSelectionDialog'
import { parseCalendarYmd } from '@/shared/utils/formatLocaleDate'

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const

const DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

type CatalogDiscountVariantOption = {
  id: string
  name: string
}

type CatalogDiscountFormDialogProps = {
  open: boolean
  kind: CatalogDiscountKind
  entityId: string
  discount: CatalogDiscount | null
  variants?: CatalogDiscountVariantOption[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function toYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formFromDiscount(discount: CatalogDiscount | null): CatalogDiscountFormState {
  if (!discount) return EMPTY_DISCOUNT_FORM
  return {
    percent: String(discount.percent),
    applyWhen: discount.applyWhen,
    weekdays: discount.weekdays,
    startDate: discount.startDate ?? '',
    endDate: discount.endDate ?? '',
    applyTo: discount.applyTo,
    userIds: discount.users.map((user) => user.id),
    applyVariants: discount.applyVariants,
    variantIds: discount.variants.map((variant) => variant.id),
  }
}

export function CatalogDiscountFormDialog({
  open,
  kind,
  entityId,
  discount,
  variants = [],
  onOpenChange,
  onSaved,
}: CatalogDiscountFormDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [values, setValues] = useState<CatalogDiscountFormState>(EMPTY_DISCOUNT_FORM)
  const [users, setUsers] = useState<CatalogDiscountUser[]>([])
  const [selectedVariants, setSelectedVariants] = useState<CatalogDiscountVariantOption[]>([])
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [variantPickerOpen, setVariantPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(formFromDiscount(discount))
    setUsers(discount?.users ?? [])
    setSelectedVariants(discount?.variants ?? [])
    setFieldErrors({})
    setFormError(null)
    setBusy(false)
    setPickerOpen(false)
    setVariantPickerOpen(false)
  }, [discount, open])

  function patch(next: Partial<CatalogDiscountFormState>) {
    setValues((current) => ({ ...current, ...next }))
  }

  function toggleWeekday(day: number, checked: boolean) {
    setValues((current) => ({
      ...current,
      weekdays: checked
        ? [...new Set([...current.weekdays, day])].sort((a, b) => a - b)
        : current.weekdays.filter((item) => item !== day),
    }))
  }

  const loadVariantOptions: LoadSelectionOptionsFn = useCallback(
    async ({ search, page, pageSize }) => {
      const query = search.trim().toLowerCase()
      const filtered = variants.filter((variant) => variant.name.toLowerCase().includes(query))
      const start = (page - 1) * pageSize
      return {
        items: filtered.slice(start, start + pageSize).map((variant) => ({
          id: variant.id,
          name: variant.name,
        })),
        hasMore: start + pageSize < filtered.length,
      }
    },
    [variants],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = catalogDiscountSchemaFor(kind).safeParse(
      toDiscountBody({
        ...values,
        userIds: users.map((user) => user.id),
        variantIds:
          values.applyVariants === 'selected' ? selectedVariants.map((variant) => variant.id) : [],
      }),
    )
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setFormError(null)
    setBusy(true)
    try {
      if (discount) {
        await companyCatalogApi.updateDiscount(kind, entityId, discount.id, parsed.data)
        toast({ title: t('priceList.discountUpdated') })
      } else {
        await companyCatalogApi.createDiscount(kind, entityId, parsed.data)
        toast({ title: t('priceList.discountAdded') })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('priceList.discountSaveFailed')
      setFormError(message)
      toast({
        title: t('priceList.discountSaveFailed'),
        description: message,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={discount ? t('priceList.editDiscountTitle') : t('priceList.addDiscountTitle')}
        description={
          kind === 'products'
            ? t('priceList.productDiscountDialogDescription')
            : t('priceList.discountDialogDescription')
        }
        sizeWidth={DIALOG_SIZE.sizeWidth}
        sizeHeight={DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={pickerOpen || variantPickerOpen}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" form="catalog-discount-form" className="h-10" disabled={busy}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {tc('save')}
            </Button>
          </>
        }
      >
        <Form id="catalog-discount-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            label={t('priceList.percent')}
            htmlFor="catalog-discount-percent"
            required
            error={fieldErrors.percent}
          >
            <Input
              id="catalog-discount-percent"
              type="number"
              min={0.01}
              max={100}
              step="0.01"
              inputMode="decimal"
              value={values.percent}
              onChange={(event) => patch({ percent: event.target.value })}
              disabled={busy}
            />
          </FormField>

          <FormField label={t('priceList.when')} htmlFor="catalog-discount-when" required>
            <RadioGroup
              value={values.applyWhen}
              onValueChange={(value) =>
                patch({ applyWhen: value as CatalogDiscountFormState['applyWhen'] })
              }
              disabled={busy}
              className="grid gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all_time" id="catalog-discount-when-all" />
                <label htmlFor="catalog-discount-when-all" className="text-sm text-foreground">
                  {t('priceList.allTime')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="selected_days" id="catalog-discount-when-days" />
                <label htmlFor="catalog-discount-when-days" className="text-sm text-foreground">
                  {t('priceList.selectedDays')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="date_range" id="catalog-discount-when-range" />
                <label htmlFor="catalog-discount-when-range" className="text-sm text-foreground">
                  {t('priceList.selectedRange')}
                </label>
              </div>
            </RadioGroup>
          </FormField>

          {values.applyWhen === 'selected_days' ? (
            <FormField
              label={t('priceList.daysLabel')}
              htmlFor="catalog-discount-days"
              required
              error={fieldErrors.weekdays}
            >
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => {
                  const id = `catalog-discount-day-${day}`
                  return (
                    <label key={day} htmlFor={id} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox
                        id={id}
                        checked={values.weekdays.includes(day)}
                        onCheckedChange={(checked) => toggleWeekday(day, checked === true)}
                        disabled={busy}
                      />
                      {t(`priceList.days.${day}`)}
                    </label>
                  )
                })}
              </div>
            </FormField>
          ) : null}

          {values.applyWhen === 'date_range' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={t('priceList.startDate')}
                htmlFor="catalog-discount-start"
                required
                error={fieldErrors.startDate}
              >
                <DatePicker
                  id="catalog-discount-start"
                  withIcon
                  value={parseCalendarYmd(values.startDate) ?? undefined}
                  onChange={(date) => patch({ startDate: date ? toYmd(date) : '' })}
                  placeholder={t('priceList.startDate')}
                  disabled={busy}
                />
              </FormField>
              <FormField
                label={t('priceList.endDate')}
                htmlFor="catalog-discount-end"
                required
                error={fieldErrors.endDate}
              >
                <DatePicker
                  id="catalog-discount-end"
                  withIcon
                  value={parseCalendarYmd(values.endDate) ?? undefined}
                  onChange={(date) => patch({ endDate: date ? toYmd(date) : '' })}
                  placeholder={t('priceList.endDate')}
                  disabled={busy}
                />
              </FormField>
            </div>
          ) : null}

          <FormField label={t('priceList.whom')} htmlFor="catalog-discount-whom" required>
            <RadioGroup
              value={values.applyTo}
              onValueChange={(value) => patch({ applyTo: value as CatalogDiscountFormState['applyTo'] })}
              disabled={busy}
              className="grid gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="everyone" id="catalog-discount-who-all" />
                <label htmlFor="catalog-discount-who-all" className="text-sm text-foreground">
                  {t('priceList.everyone')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="selected_users" id="catalog-discount-who-users" />
                <label htmlFor="catalog-discount-who-users" className="text-sm text-foreground">
                  {t('priceList.selectedUsers')}
                </label>
              </div>
            </RadioGroup>
          </FormField>

          {values.applyTo === 'selected_users' ? (
            <FormField
              label={t('priceList.users')}
              htmlFor="catalog-discount-users"
              required
              error={fieldErrors.userIds}
            >
              <div className="space-y-2">
                <Button
                  id="catalog-discount-users"
                  type="button"
                  variant="outline"
                  className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
                  disabled={busy}
                  onClick={() => setPickerOpen(true)}
                >
                  {t('priceList.selectUser')}
                </Button>
                {users.length > 0 ? (
                  <ul className="space-y-1">
                    {users.map((user) => (
                      <li key={user.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{user.displayName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2"
                          disabled={busy}
                          onClick={() => setUsers((current) => current.filter((item) => item.id !== user.id))}
                        >
                          {tc('remove')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </FormField>
          ) : null}

          {kind === 'products' ? (
            <FormField
              label={t('priceList.which')}
              htmlFor="catalog-discount-which"
              required
              error={fieldErrors.applyVariants}
            >
              <RadioGroup
                value={values.applyVariants}
                onValueChange={(value) =>
                  patch({ applyVariants: value as CatalogDiscountFormState['applyVariants'] })
                }
                disabled={busy}
                className="grid gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="catalog-discount-which-all" />
                  <label htmlFor="catalog-discount-which-all" className="text-sm text-foreground">
                    {t('priceList.allVariants')}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="selected" id="catalog-discount-which-selected" />
                  <label htmlFor="catalog-discount-which-selected" className="text-sm text-foreground">
                    {t('priceList.selectedVariants')}
                  </label>
                </div>
              </RadioGroup>
            </FormField>
          ) : null}

          {kind === 'products' && values.applyVariants === 'selected' ? (
            <FormField
              label={t('priceList.variant')}
              htmlFor="catalog-discount-variant"
              required
              error={fieldErrors.variantIds}
            >
              <div className="space-y-2">
                <Button
                  id="catalog-discount-variant"
                  type="button"
                  variant="outline"
                  className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
                  disabled={busy || variants.length === 0}
                  onClick={() => setVariantPickerOpen(true)}
                >
                  {t('priceList.selectVariant')}
                </Button>
                {variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('priceList.noVariants')}</p>
                ) : null}
                {selectedVariants.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedVariants.map((variant) => (
                      <li key={variant.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{variant.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2"
                          disabled={busy}
                          onClick={() =>
                            setSelectedVariants((current) => current.filter((item) => item.id !== variant.id))
                          }
                        >
                          {tc('remove')}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </FormField>
          ) : null}
        </Form>
      </CustomDialog>

      <UserSelectionDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={t('priceList.selectUsersTitle')}
        description={t('priceList.selectUsersDescription')}
        loadUsers={(params) =>
          loadIdentityUsersForStaff(
            accessToken ?? '',
            params,
            new Set(users.map((user) => user.id)),
          )
        }
        onSelect={(user) => {
          setUsers((current) =>
            current.some((item) => item.id === user.id)
              ? current
              : [
                  ...current,
                  {
                    id: user.id,
                    displayName: user.displayName,
                    email: user.email,
                    avatarUrl: user.avatarUrl ?? null,
                  },
                ],
          )
          setPickerOpen(false)
        }}
      />
      {kind === 'products' ? (
        <OptionSelectionDialog
          open={variantPickerOpen}
          onOpenChange={setVariantPickerOpen}
          multiple
          loadOptions={loadVariantOptions}
          initialSelected={selectedVariants.map((variant) => ({ id: variant.id, name: variant.name }))}
          onSelect={(options: SelectionOption[]) => {
            setSelectedVariants(options.map((option) => ({ id: option.id, name: option.name })))
          }}
          title={t('priceList.selectVariantsTitle')}
          description={t('priceList.selectVariantsDescription')}
          searchPlaceholder={t('priceList.searchVariants')}
          emptyMessage={t('priceList.noVariants')}
          nestedDismissGuard={pickerOpen}
        />
      ) : null}
    </>
  )
}
