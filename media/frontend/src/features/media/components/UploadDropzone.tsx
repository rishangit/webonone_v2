import { useCallback, useRef, useState } from 'react'
import { Button, Spinner } from '@webonone/ui-kit'

interface UploadDropzoneProps {
  accept: string
  multiple?: boolean
  maxFiles?: number
  disabled?: boolean
  onFilesSelected: (files: File[]) => void | Promise<void>
}

export function UploadDropzone({
  accept,
  multiple = true,
  maxFiles = 10,
  disabled,
  onFilesSelected,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length || disabled) return
      const files = Array.from(fileList).slice(0, maxFiles)
      setIsUploading(true)
      try {
        await onFilesSelected(files)
      } finally {
        setIsUploading(false)
      }
    },
    [disabled, maxFiles, onFilesSelected],
  )

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      } ${disabled || isUploading ? 'opacity-50' : 'cursor-pointer'}`}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled && !isUploading) {
          setIsDragging(true)
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        void handleFiles(e.dataTransfer.files)
      }}
      onClick={() => {
        if (!disabled && !isUploading) {
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
          inputRef.current?.click()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled || isUploading}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Spinner />
          <p className="text-sm text-muted-foreground">Uploading…</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or click to browse
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" disabled={disabled}>
            Choose files
          </Button>
        </>
      )}
    </div>
  )
}
