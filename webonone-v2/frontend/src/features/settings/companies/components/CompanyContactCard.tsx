import { useEffect, useState } from 'react'
import { Edit3 } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormField,
  Input,
  PhoneInput,
  formatPhoneE164,
  getBrowserDefaultCountryIso2,
  mapZodIssuesToFieldErrors,
  parsePhoneE164,
} from '@webonone/ui-kit'
import {
  companyContactCardSchema,
  type CompanyContactCardValues,
} from '@/features/settings/basic/schemas/companySchemas'
import type { CompanyDetail } from '@/features/settings/basic/services/companyApi'

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

type CompanyContactCardProps = {
  detail: CompanyDetail
  canEdit: boolean
  saving: boolean
  onSave: (values: CompanyContactCardValues) => void
}

export function CompanyContactCard({ detail, canEdit, saving, onSave }: CompanyContactCardProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [email, setEmail] = useState(detail.contactEmail ?? '')
  const [phoneCountry, setPhoneCountry] = useState(() => getBrowserDefaultCountryIso2())
  const [phoneNational, setPhoneNational] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyContactCardValues, string>>>({})

  useEffect(() => {
    setEmail(detail.contactEmail ?? '')
    const parsed = parsePhoneE164(detail.contactPhone, {
      fallbackIso2: getBrowserDefaultCountryIso2(),
    })
    setPhoneCountry(parsed.iso2)
    setPhoneNational(parsed.nationalNumber)
    setErrors({})
    setMode('view')
  }, [detail])

  function handleCancel() {
    setEmail(detail.contactEmail ?? '')
    const parsed = parsePhoneE164(detail.contactPhone, {
      fallbackIso2: getBrowserDefaultCountryIso2(),
    })
    setPhoneCountry(parsed.iso2)
    setPhoneNational(parsed.nationalNumber)
    setErrors({})
    setMode('view')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const contactPhone = formatPhoneE164(phoneCountry, phoneNational) || phoneNational.trim()
    const parsed = companyContactCardSchema.safeParse({
      contactEmail: email,
      contactPhone,
    })
    if (!parsed.success) {
      setErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setErrors({})
    onSave(parsed.data)
  }

  const isEmpty = !detail.contactEmail && !detail.contactPhone

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Contact information</CardTitle>
          <CardDescription>How customers and the platform reach this company</CardDescription>
        </div>
        {canEdit ? (
          mode === 'view' ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setMode('edit')}>
              <Edit3 className="h-4 w-4" aria-hidden />
              {isEmpty ? 'Add contact' : 'Edit'}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" form="company-contact-card-form" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )
        ) : null}
      </CardHeader>
      <CardContent>
        {mode === 'view' ? (
          <div className="space-y-4">
            {isEmpty ? (
              <p className="text-sm text-muted-foreground">
                No contact details yet. Add email and phone to complete this section.
              </p>
            ) : null}
            <ReadOnlyField label="Contact email" value={detail.contactEmail} />
            <ReadOnlyField label="Contact phone" value={detail.contactPhone} />
          </div>
        ) : (
          <Form id="company-contact-card-form" onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Contact email"
              htmlFor="company-contact-email"
              required
              error={errors.contactEmail}
            >
              <Input
                id="company-contact-email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField
              label="Contact phone"
              htmlFor="company-contact-phone"
              required
              error={errors.contactPhone}
            >
              <PhoneInput
                id="company-contact-phone"
                country={phoneCountry}
                value={phoneNational}
                onCountryChange={(country) => setPhoneCountry(country.iso2)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhoneNational(e.target.value)
                }
                aria-invalid={Boolean(errors.contactPhone)}
              />
            </FormField>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
