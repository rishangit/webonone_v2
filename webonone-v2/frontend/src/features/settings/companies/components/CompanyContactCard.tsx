import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  PhoneInput,
  type PhoneCountry,
} from '@webonone/ui-kit'
import type { CompanyContactCardValues } from '@/features/settings/basic/schemas/companySchemas'
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
  mode: 'view' | 'edit'
  email: string
  phoneCountry: string
  phoneNational: string
  errors: Partial<Record<keyof CompanyContactCardValues, string>>
  onEmailChange: (email: string) => void
  onPhoneCountryChange: (country: PhoneCountry) => void
  onPhoneNationalChange: (value: string) => void
}

export function CompanyContactCard({
  detail,
  mode,
  email,
  phoneCountry,
  phoneNational,
  errors,
  onEmailChange,
  onPhoneCountryChange,
  onPhoneNationalChange,
}: CompanyContactCardProps) {
  const isEmpty = !detail.contactEmail && !detail.contactPhone

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact information</CardTitle>
        <CardDescription>How customers and the platform reach this company</CardDescription>
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
          <div className="space-y-4">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
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
                onCountryChange={onPhoneCountryChange}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onPhoneNationalChange(e.target.value)
                }
                aria-invalid={Boolean(errors.contactPhone)}
              />
            </FormField>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
