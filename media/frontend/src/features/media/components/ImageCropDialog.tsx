import { useCallback, useEffect, useRef, useState } from 'react'
import type { CropAspectPreset } from '@webonone/media-embed'
import { Button, CustomDialog } from '@webonone/ui-kit'

const ASPECT_PRESETS: { label: CropAspectPreset; ratio: number | null }[] = [
  { label: '1:1', ratio: 1 },
  { label: '1:2', ratio: 1 / 2 },
  { label: '2:1', ratio: 2 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: 'free', ratio: null },
]

interface ImageCropDialogProps {
  open: boolean
  file: File | null
  defaultAspect?: CropAspectPreset
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function getAspectRatio(preset: CropAspectPreset): number | null {
  return ASPECT_PRESETS.find((p) => p.label === preset)?.ratio ?? null
}

function cropImageToBlob(
  img: HTMLImageElement,
  aspect: CropAspectPreset,
): Promise<Blob> {
  const ratio = getAspectRatio(aspect)
  const sourceWidth = img.naturalWidth
  const sourceHeight = img.naturalHeight

  let cropWidth = sourceWidth
  let cropHeight = sourceHeight

  if (ratio !== null) {
    if (sourceWidth / sourceHeight > ratio) {
      cropHeight = sourceHeight
      cropWidth = Math.round(sourceHeight * ratio)
    } else {
      cropWidth = sourceWidth
      cropHeight = Math.round(sourceWidth / ratio)
    }
  }

  const sx = Math.round((sourceWidth - cropWidth) / 2)
  const sy = Math.round((sourceHeight - cropHeight) / 2)

  const canvas = document.createElement('canvas')
  canvas.width = cropWidth
  canvas.height = cropHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Promise.reject(new Error('Canvas not supported'))
  }
  ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to crop image'))
        }
      },
      fileTypeFromName(img),
      0.92,
    )
  })
}

function fileTypeFromName(img: HTMLImageElement): string {
  return img.src.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
}

export function ImageCropDialog({
  open,
  file,
  defaultAspect = 'free',
  onConfirm,
  onCancel,
}: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aspect, setAspect] = useState<CropAspectPreset>(defaultAspect)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAspect(defaultAspect)
  }, [defaultAspect, file])

  useEffect(() => {
    if (!file || !open) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, open])

  const drawPreview = useCallback(async () => {
    if (!file || !canvasRef.current || !open) {
      return
    }
    try {
      const img = await loadImage(file)
      const canvas = canvasRef.current
      const maxSize = 480
      const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1)
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const ratio = getAspectRatio(aspect)
      if (ratio !== null) {
        let overlayW = canvas.width
        let overlayH = canvas.height
        if (canvas.width / canvas.height > ratio) {
          overlayH = canvas.height
          overlayW = overlayH * ratio
        } else {
          overlayW = canvas.width
          overlayH = overlayW / ratio
        }
        const x = (canvas.width - overlayW) / 2
        const y = (canvas.height - overlayH) / 2
        ctx.strokeStyle = 'hsl(var(--primary))'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, overlayW, overlayH)
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.clearRect(x, y, overlayW, overlayH)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = 'hsl(var(--primary))'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, overlayW, overlayH)
      }
    } catch {
      setError('Failed to preview image')
    }
  }, [aspect, file, open])

  useEffect(() => {
    void drawPreview()
  }, [drawPreview, previewUrl])

  async function handleConfirm() {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    try {
      const img = await loadImage(file)
      const blob = await cropImageToBlob(img, aspect)
      const cropped = new File([blob], file.name, { type: blob.type || file.type })
      onConfirm(cropped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crop failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      title="Crop image"
      sizeWidth="medium"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={isProcessing || !file}>
            {isProcessing ? 'Processing…' : 'Apply crop'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ASPECT_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={aspect === preset.label ? 'default' : 'outline'}
              onClick={() => setAspect(preset.label)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="max-h-80 rounded-md border bg-muted/30" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </CustomDialog>
  )
}
