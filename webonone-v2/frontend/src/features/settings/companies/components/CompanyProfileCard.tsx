import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  isStatusTagVariant,
  StatusTag,
  Textarea,
} from '@webonone/ui-kit'
import {
  COMPANY_SIZE_OPTIONS,
  type CompanyProfileCardValues,
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

type CompanyProfileCardProps = {
  detail: CompanyDetail
  mode: 'view' | 'edit'
  values: CompanyProfileCardValues
  errors: Partial<Record<keyof CompanyProfileCardValues, string>>
  onChange: (values: CompanyProfileCardValues) => void
}

export function CompanyProfileCard({
  detail,
  mode,
  values,
  errors,
  onChange,
}: CompanyProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Company profile</CardTitle>
        <CardDescription>Identity of the company on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {mode === 'view' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold">{detail.name}</h3>
              <StatusTag variant={detail.status} />
            </div>
            {detail.role ? (
              isStatusTagVariant(detail.role) ? (
                <StatusTag variant={detail.role} className="shrink-0" />
              ) : (
                <span className="text-sm text-muted-foreground">{detail.role}</span>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Super admin view</p>
            )}
            <ReadOnlyField label="Description" value={detail.description} />
            <ReadOnlyField label="Company size" value={detail.companySize} />
          </div>
        ) : (
          <div className="space-y-4">
            <FormField label="Company name" htmlFor="company-profile-name" required error={errors.name}>
              <Input
                id="company-profile-name"
                value={values.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange({ ...values, name: e.target.value })
                }
              />
            </FormField>
            <FormField
              label="Description"
              htmlFor="company-profile-description"
              required
              error={errors.description}
            >
              <Textarea
                id="company-profile-description"
                value={values.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChange({ ...values, description: e.target.value })
                }
              />
            </FormField>
            <FormField
              label="Company size"
              htmlFor="company-profile-size"
              required
              error={errors.companySize}
            >
              <Select
                value={values.companySize}
                onValueChange={(companySize: string) =>
                  onChange({
                    ...values,
                    companySize: companySize as CompanyProfileCardValues['companySize'],
                  })
                }
              >
                <SelectTrigger id="company-profile-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
