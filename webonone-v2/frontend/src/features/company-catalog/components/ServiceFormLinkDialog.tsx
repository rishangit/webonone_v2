import { useEffect, useState } from 'react'
import {
  Alert,
  AlertDescription,
  Button,
  CustomDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  useToast,
} from '@webonone/ui-kit'
import { designFormsApi, type DesignFormTemplateListItem } from '@/features/design/services/designFormsApi'
import { companyCatalogApi } from '@/features/company-catalog/services/companyCatalogApi'

type ServiceFormLinkDialogProps = {
  open: boolean
  serviceId: string
  currentFormTemplateId: string | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function ServiceFormLinkDialog({
  open,
  serviceId,
  currentFormTemplateId,
  onOpenChange,
  onSaved,
}: ServiceFormLinkDialogProps) {
  const { toast } = useToast()
  const [forms, setForms] = useState<DesignFormTemplateListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(currentFormTemplateId)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedId(currentFormTemplateId)
    setError(null)
    let cancelled = false
    setLoading(true)
    designFormsApi
      .listPublished()
      .then((result) => {
        if (!cancelled) setForms(result.items)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load forms')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, currentFormTemplateId])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await companyCatalogApi.updateServiceForm(serviceId, selectedId)
      toast({ title: 'Form linked', description: selectedId ? 'Service form updated.' : 'Form unlinked.' })
      onSaved()
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to save form link'
      setError(message)
      toast({ title: 'Save failed', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Linked form"
      description="Choose a published Design form for this service."
      sizeWidth="medium"
      sizeHeight="medium"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Select
            value={selectedId ?? '__none__'}
            onValueChange={(value) => setSelectedId(value === '__none__' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No form</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {forms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published forms yet. Publish a form in Design first.
            </p>
          ) : null}
        </div>
      )}
    </CustomDialog>
  )
}
