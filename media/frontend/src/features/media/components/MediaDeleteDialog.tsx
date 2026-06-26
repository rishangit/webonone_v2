import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@webonone/ui-kit'

interface MediaDeleteDialogProps {
  open: boolean
  fileName: string | null
  isDeleting: boolean
  title?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function MediaDeleteDialog({
  open,
  fileName,
  isDeleting,
  title = 'Delete media',
  onOpenChange,
  onConfirm,
}: MediaDeleteDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isDeleting) return
        onOpenChange(next)
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {fileName
              ? `Delete "${fileName}"? This cannot be undone.`
              : 'Delete this file? This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
