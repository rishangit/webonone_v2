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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatusTag,
  Textarea,
  mapZodIssuesToFieldErrors,
} from '@webonone/ui-kit'
import {
  COMPANY_SIZE_OPTIONS,
  companyProfileCardSchema,
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
  canEdit: boolean
  saving: boolean
  onSave: (values: CompanyProfileCardValues) => void
}

export function CompanyProfileCard({ detail, canEdit, saving, onSave }: CompanyProfileCardProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [values, setValues] = useState<CompanyProfileCardValues>({
    name: detail.name,
    description: detail.description ?? '',
    companySize: (detail.companySize as CompanyProfileCardValues['companySize']) || '1-10',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyProfileCardValues, string>>>({})

  useEffect(() => {
    setValues({
      name: detail.name,
      description: detail.description ?? '',
      companySize: (detail.companySize as CompanyProfileCardValues['companySize']) || '1-10',
    })
    setErrors({})
    setMode('view')
  }, [detail])

  function handleCancel() {
    setValues({
      name: detail.name,
      description: detail.description ?? '',
      companySize: (detail.companySize as CompanyProfileCardValues['companySize']) || '1-10',
    })
    setErrors({})
    setMode('view')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = companyProfileCardSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
      return
    }
    setErrors({})
    onSave(parsed.data)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Company profile</CardTitle>
          <CardDescription>Identity of the company on the platform</CardDescription>
        </div>
        {canEdit ? (
          mode === 'view' ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setMode('edit')}>
              <Edit3 className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" size="sm" form="company-profile-card-form" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )
        ) : null}
      </CardHeader>
      <CardContent>
        {mode === 'view' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold">{detail.name}</h3>
              <StatusTag variant={detail.status} />
            </div>
            {detail.role ? (
              <p className="text-sm text-muted-foreground">
                {detail.role === 'company_admin' ? 'Company Owner' : 'Member'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Super admin view</p>
            )}
            <ReadOnlyField label="Description" value={detail.description} />
            <ReadOnlyField label="Company size" value={detail.companySize} />
          </div>
        ) : (
          <Form id="company-profile-card-form" onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Company name" htmlFor="company-profile-name" required error={errors.name}>
              <Input
                id="company-profile-name"
                value={values.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValues((v) => ({ ...v, name: e.target.value }))
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
                  setValues((v) => ({ ...v, description: e.target.value }))
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
                  setValues((v) => ({
                    ...v,
                    companySize: companySize as CompanyProfileCardValues['companySize'],
                  }))
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
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
