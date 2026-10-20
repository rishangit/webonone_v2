import { useEffect, useState } from 'react'
import { FolderPlus } from 'lucide-react'
import {
  useRequestPlatformPeerDialog,
} from '@webonone/platform-embed'
import { Button, CustomDialog, Form, FormField, Input } from '@webonone/ui-kit'

export const CREATE_FOLDER_DIALOG = {
  title: 'New folder',
  description: 'Enter a name for the new folder.',
  submitLabel: 'OK',
  creatingLabel: 'Creating…',
  cancelLabel: 'Cancel',
  sizeWidth: 'small' as const,
  sizeHeight: 'auto' as const,
}

export function buildCreateFolderDialogPath(scope: string, folderPath: string): string {
  const params = new URLSearchParams({
    mediaScope: scope,
    folderPath,
  })
  return `/embed/dialogs/folders/create?${params.toString()}`
}

export function folderPathForName(parentPath: string, name: string): string {
  return parentPath === '/' ? `/${name}` : `${parentPath}/${name}`
}

export function validateFolderName(name: string): string | undefined {
  const trimmed = name.trim()
  if (!trimmed) return 'Folder name is required'
  if (/[\\/]/.test(trimmed)) return 'Folder name cannot contain slashes'
  return undefined
}

interface CreateFolderFieldsProps {
  name: string
  error?: string
  disabled?: boolean
  onNameChange: (name: string) => void
  onSubmit: () => void
}

export function CreateFolderFields({
  name,
  error,
  disabled,
  onNameChange,
  onSubmit,
}: CreateFolderFieldsProps) {
  return (
    <Form
      id="create-folder-form"
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <FormField label="Folder name" htmlFor="create-folder-name" required error={error}>
        <Input
          id="create-folder-name"
          value={name}
          autoFocus
          disabled={disabled}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Folder name"
        />
      </FormField>
    </Form>
  )
}

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<void>
  /** When the browser is inside a parent iframe, the parent hosts this dialog. */
  parentOrigin?: string | null
  scope?: string
  folderPath?: string
  /** Parent finished creating the folder. Refresh the open list. */
  onHostedCreated?: () => void
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onCreate,
  parentOrigin = null,
  scope = '',
  folderPath = '/',
  onHostedCreated,
}: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const dialogPath = buildCreateFolderDialogPath(scope, folderPath)

  const { isHosted } = useRequestPlatformPeerDialog({
    parentOrigin,
    open: Boolean(parentOrigin) && open,
    path: dialogPath,
    title: CREATE_FOLDER_DIALOG.title,
    description: CREATE_FOLDER_DIALOG.description,
    submitLabel: CREATE_FOLDER_DIALOG.submitLabel,
    cancelLabel: CREATE_FOLDER_DIALOG.cancelLabel,
    sizeWidth: CREATE_FOLDER_DIALOG.sizeWidth,
    sizeHeight: CREATE_FOLDER_DIALOG.sizeHeight,
    onResult: () => {
      onOpenChange(false)
      onHostedCreated?.()
    },
    onCancel: () => onOpenChange(false),
  })

  useEffect(() => {
    if (!open) {
      setName('')
      setError(undefined)
    }
  }, [open])

  async function handleSubmit() {
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

  if (isHosted) return null

  return (
    <CustomDialog
      open={open}
      onOpenChange={onOpenChange}
      title={CREATE_FOLDER_DIALOG.title}
      description={CREATE_FOLDER_DIALOG.description}
      icon={<FolderPlus className="h-5 w-5" />}
      sizeWidth={CREATE_FOLDER_DIALOG.sizeWidth}
      sizeHeight={CREATE_FOLDER_DIALOG.sizeHeight}
      nestedDismissGuard={isSaving}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {CREATE_FOLDER_DIALOG.cancelLabel}
          </Button>
          <Button
            type="submit"
            form="create-folder-form"
            className="h-10 px-4"
            disabled={isSaving}
          >
            {isSaving ? CREATE_FOLDER_DIALOG.creatingLabel : CREATE_FOLDER_DIALOG.submitLabel}
          </Button>
        </>
      }
    >
      <CreateFolderFields
        name={name}
        error={error}
        disabled={isSaving}
        onNameChange={(next) => {
          setName(next)
          if (error) setError(undefined)
        }}
        onSubmit={() => void handleSubmit()}
      />
    </CustomDialog>
  )
}
