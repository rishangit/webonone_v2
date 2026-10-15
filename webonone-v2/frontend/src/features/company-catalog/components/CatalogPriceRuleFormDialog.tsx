import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  CustomDialog,
  Form,
  FormField,
  Input,
  RadioGroup,
  RadioGroupItem,
  SelectUser,
  type SelectUserValue,
  UserSelectionDialog,
  mapZodIssuesToFieldErrors,
  useToast,
} from '@webonone/ui-kit'
import { useAppSelector } from '@/app/store/hooks'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'
import {
  catalogPriceRuleBodySchema,
  EMPTY_PRICE_RULE_FORM,
  toPriceRuleBody,
  type CatalogPriceRuleFormState,
} from '@/features/company-catalog/schemas/catalogPriceRuleSchemas'
import type {
  CatalogPriceKind,
  CatalogPriceRule,
  CatalogPriceRuleUser,
} from '@/features/company-catalog/types/catalogPriceRule.types'
import { loadIdentityUsersForStaff } from '@/features/staff/services/identityUsersApi'

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const

const DIALOG_SIZE = {
  sizeWidth: 'medium' as const,
  sizeHeight: 'large' as const,
}

type CatalogPriceRuleFormDialogProps = {
  open: boolean
  kind: CatalogPriceKind
  entityId: string
  rule: CatalogPriceRule | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function toSelectUser(user: CatalogPriceRuleUser): SelectUserValue {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email ?? '',
    avatarUrl: user.avatarUrl,
  }
}

function formFromRule(rule: CatalogPriceRule | null): CatalogPriceRuleFormState {
  if (!rule) return EMPTY_PRICE_RULE_FORM
  return {
    price: String(rule.price),
    applyWhen: rule.applyWhen,
    weekdays: rule.weekdays,
    timeScope: rule.startTime && rule.endTime ? 'specific_time' : 'full_day',
    startTime: rule.startTime ?? '',
    endTime: rule.endTime ?? '',
    applyTo: rule.applyTo,
    userIds: rule.users.map((user) => user.id),
  }
}

export function CatalogPriceRuleFormDialog({
  open,
  kind,
  entityId,
  rule,
  onOpenChange,
  onSaved,
}: CatalogPriceRuleFormDialogProps) {
  const { t } = useTranslation('catalog')
  const { t: tc } = useTranslation('common')
  const { toast } = useToast()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [values, setValues] = useState<CatalogPriceRuleFormState>(EMPTY_PRICE_RULE_FORM)
  const [users, setUsers] = useState<SelectUserValue[]>([])
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(formFromRule(rule))
    setUsers(rule?.users.map(toSelectUser) ?? [])
    setFieldErrors({})
    setFormError(null)
    setBusy(false)
    setPickerOpen(false)
  }, [open, rule])

  function patch(next: Partial<CatalogPriceRuleFormState>) {
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const body = toPriceRuleBody({ ...values, userIds: users.map((user) => user.id) })
    const parsed = catalogPriceRuleBodySchema.safeParse(body)
    if (!parsed.success) {
      setFieldErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setFieldErrors({})
    setFormError(null)
    setBusy(true)
    try {
      if (rule) {
        await companyCatalogApi.updatePriceRule(kind, entityId, rule.id, parsed.data)
        toast({ title: t('priceList.updated') })
      } else {
        await companyCatalogApi.createPriceRule(kind, entityId, parsed.data)
        toast({ title: t('priceList.added') })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('priceList.saveFailed')
      setFormError(message)
      toast({ title: t('priceList.saveFailed'), description: message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <CustomDialog
        open={open}
        onOpenChange={onOpenChange}
        title={rule ? t('priceList.editTitle') : t('priceList.addTitle')}
        description={t('priceList.dialogDescription')}
        sizeWidth={DIALOG_SIZE.sizeWidth}
        sizeHeight={DIALOG_SIZE.sizeHeight}
        nestedDismissGuard={pickerOpen}
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
            <Button type="submit" form="catalog-price-rule-form" className="h-10" disabled={busy}>
              <Save className="mr-2 h-4 w-4" aria-hidden />
              {tc('save')}
            </Button>
          </>
        }
      >
        <Form id="catalog-price-rule-form" onSubmit={(event) => void handleSubmit(event)}>
          {formError ? (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField label={t('priceList.price')} htmlFor="catalog-price-rule-price" required error={fieldErrors.price}>
            <Input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={values.price}
              onChange={(event) => patch({ price: event.target.value })}
              disabled={busy}
            />
          </FormField>

          <FormField label={t('priceList.when')} htmlFor="catalog-price-rule-when" required>
            <RadioGroup
              value={values.applyWhen}
              onValueChange={(value) => patch({ applyWhen: value as CatalogPriceRuleFormState['applyWhen'] })}
              disabled={busy}
              className="grid gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all_time" id="catalog-price-when-all" />
                <label htmlFor="catalog-price-when-all" className="text-sm text-foreground">
                  {t('priceList.allTime')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="selected_days" id="catalog-price-when-days" />
                <label htmlFor="catalog-price-when-days" className="text-sm text-foreground">
                  {t('priceList.selectedDays')}
                </label>
              </div>
            </RadioGroup>
          </FormField>

          {values.applyWhen === 'selected_days' ? (
            <>
              <FormField
                label={t('priceList.daysLabel')}
                htmlFor="catalog-price-rule-days"
                required
                error={fieldErrors.weekdays}
              >
                <div className="flex flex-wrap gap-3">
                  {WEEKDAYS.map((day) => {
                    const id = `catalog-price-day-${day}`
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
              <FormField
                label={t('priceList.timeScope')}
                htmlFor="catalog-price-rule-time"
                required
                error={fieldErrors.timeScope}
              >
                <RadioGroup
                  value={values.timeScope}
                  onValueChange={(value) =>
                    patch({ timeScope: value as CatalogPriceRuleFormState['timeScope'] })
                  }
                  disabled={busy}
                  className="grid gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="full_day" id="catalog-price-time-full" />
                    <label htmlFor="catalog-price-time-full" className="text-sm text-foreground">
                      {t('priceList.fullDay')}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="specific_time" id="catalog-price-time-specific" />
                    <label htmlFor="catalog-price-time-specific" className="text-sm text-foreground">
                      {t('priceList.specificTime')}
                    </label>
                  </div>
                </RadioGroup>
              </FormField>
              {values.timeScope === 'specific_time' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label={t('priceList.startTime')}
                    htmlFor="catalog-price-rule-start"
                    required
                    error={fieldErrors.startTime}
                  >
                    <Input
                      type="time"
                      value={values.startTime}
                      onChange={(event) => patch({ startTime: event.target.value })}
                      disabled={busy}
                    />
                  </FormField>
                  <FormField
                    label={t('priceList.endTime')}
                    htmlFor="catalog-price-rule-end"
                    required
                    error={fieldErrors.endTime}
                  >
                    <Input
                      type="time"
                      value={values.endTime}
                      onChange={(event) => patch({ endTime: event.target.value })}
                      disabled={busy}
                    />
                  </FormField>
                </div>
              ) : null}
            </>
          ) : null}

          <FormField label={t('priceList.whom')} htmlFor="catalog-price-rule-whom" required>
            <RadioGroup
              value={values.applyTo}
              onValueChange={(value) => patch({ applyTo: value as CatalogPriceRuleFormState['applyTo'] })}
              disabled={busy}
              className="grid gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="everyone" id="catalog-price-who-all" />
                <label htmlFor="catalog-price-who-all" className="text-sm text-foreground">
                  {t('priceList.everyone')}
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="selected_users" id="catalog-price-who-users" />
                <label htmlFor="catalog-price-who-users" className="text-sm text-foreground">
                  {t('priceList.selectedUsers')}
                </label>
              </div>
            </RadioGroup>
          </FormField>

          {values.applyTo === 'selected_users' ? (
            <FormField
              label={t('priceList.users')}
              htmlFor="catalog-price-rule-users"
              required
              error={fieldErrors.userIds}
            >
              <div className="space-y-2">
                <SelectUser
                  multiple
                  selectedUsers={users}
                  placeholder={t('priceList.selectUsers')}
                  onClick={() => setPickerOpen(true)}
                  disabled={busy}
                />
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
                    email: user.email ?? '',
                    avatarUrl: user.avatarUrl,
                  },
                ],
          )
          setPickerOpen(false)
        }}
      />
    </>
  )
}
