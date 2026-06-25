import { useEffect, useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { Button, CustomDialog, Form, FormField, Input } from '@webonone/ui-kit'

function validateFolderName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Folder name is required'
  if (/[\\/]/.test(trimmed)) return 'Folder name cannot contain slashes'
  return undefined
}

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<void>
}

export function CreateFolderDialog({ open, onOpenChange, onCreate }: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setError(undefined)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateFolderName(name)
    if (validationError) {
      setError(validationError)
      return
    }
    setIsSaving(true)
    setError(undefined)
    try {
      await onCreate(name.trim())
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New folder"
      description="Enter a name for the new folder."
      icon={<FolderPlus className="h-5 w-5" />}
      sizeWidth="small"
      sizeHeight="auto"
      nestedDismissGuard={isSaving}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="create-folder-form" disabled={isSaving}>
            {isSaving ? 'Creating…' : 'OK'}
          </Button>
        </>
      }
    >
      <Form id="create-folder-form" className="space-y-2" onSubmit={(e) => void handleSubmit(e)}>
        <FormField label="Folder name" htmlFor="create-folder-name" error={error}>
          <Input
            id="create-folder-name"
            value={name}
            autoFocus
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError(undefined)
            }}
            placeholder="Folder name"
          />
        </FormField>
      </Form>
    </CustomDialog>
  )
}
