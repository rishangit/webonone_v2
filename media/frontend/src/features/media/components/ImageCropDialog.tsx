import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import type { Area, Point } from 'react-easy-crop'
import Cropper from 'react-easy-crop'
import { Crop } from 'lucide-react'
import type { CropAspectPreset } from '@webonone/media-embed'
import {
  Button,
  CustomDialog,
  Label,
  RadioGroup,
  RadioGroupItem,
  Slider,
} from '@webonone/ui-kit'
import 'react-easy-crop/react-easy-crop.css'

const ASPECT_PRESETS: { label: CropAspectPreset; ratio: number | null }[] = [
  { label: '1:1', ratio: 1 },
  { label: '1:2', ratio: 1 / 2 },
  { label: '2:1', ratio: 2 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: 'free', ratio: null },
]

export interface ImageCropDialogHandle {
  confirm: () => Promise<void>
}

interface ImageCropDialogProps {
  open: boolean
  file: File | null
  defaultAspect?: CropAspectPreset
  aspectPresets?: CropAspectPreset[]
  stackLevel?: number
  /** Render crop controls only — consumer owns the CustomDialog shell (embed iframe). */
  embedded?: boolean
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}

function getAspectRatio(preset: CropAspectPreset): number | undefined {
  const ratio = ASPECT_PRESETS.find((p) => p.label === preset)?.ratio
  return ratio ?? undefined
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('Failed to load image')))
    image.crossOrigin = 'anonymous'
    image.src = url
  })
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  mimeType: string,
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas not supported')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  const outputType = mimeType.startsWith('image/png') ? 'image/png' : 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to crop image'))
        }
      },
      outputType,
      0.92,
    )
  })
}

export const ImageCropDialog = forwardRef<ImageCropDialogHandle, ImageCropDialogProps>(
  function ImageCropDialog(
    {
      open,
      file,
      defaultAspect = 'free',
      aspectPresets,
      stackLevel = 1,
      embedded = false,
      onConfirm,
      onCancel,
    },
    ref,
  ) {
  const [aspectPreset, setAspectPreset] = useState<CropAspectPreset>(defaultAspect)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [mediaAspect, setMediaAspect] = useState(1)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visiblePresets = aspectPresets
    ? ASPECT_PRESETS.filter((preset) => aspectPresets.includes(preset.label))
    : ASPECT_PRESETS

  useEffect(() => {
    setAspectPreset(defaultAspect)
    setMediaAspect(1)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
  }, [defaultAspect, file, open])

  useEffect(() => {
    if (!file || !open) {
      setImageSrc(null)
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file, open])

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const cropAspect = getAspectRatio(aspectPreset) ?? mediaAspect

  const handleConfirm = useCallback(async () => {
    if (!file || !imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    setError(null)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, file.type)
      const cropped = new File([blob], file.name, { type: blob.type || file.type })
      onConfirm(cropped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crop failed')
    } finally {
      setIsProcessing(false)
    }
  }, [croppedAreaPixels, file, imageSrc, onConfirm])

  useImperativeHandle(ref, () => ({ confirm: handleConfirm }), [handleConfirm])

  const footerActions = (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 px-4 border-[hsl(var(--glass-border))] text-foreground hover:bg-accent"
        onClick={onCancel}
        disabled={isProcessing}
      >
        Cancel
      </Button>
      <Button
        type="button"
        className="h-10"
        onClick={() => void handleConfirm()}
        disabled={isProcessing || !file || !croppedAreaPixels}
      >
        {isProcessing ? 'Processing…' : 'Crop & Upload'}
      </Button>
    </>
  )

  const aspectControls =
    visiblePresets.length > 1 ? (
      <RadioGroup
        value={aspectPreset}
        onValueChange={(value) => setAspectPreset(value as CropAspectPreset)}
        className="flex flex-wrap gap-x-4 gap-y-2"
      >
        {visiblePresets.map((preset) => (
          <div key={preset.label} className="flex items-center gap-2">
            <RadioGroupItem value={preset.label} id={`crop-aspect-${preset.label}`} />
            <Label htmlFor={`crop-aspect-${preset.label}`} className="cursor-pointer text-sm">
              {preset.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    ) : null

  const cropperStyle = {
    cropAreaStyle: { border: '2px solid hsl(var(--primary))' },
  }

  const cropperNode = imageSrc ? (
    <Cropper
      image={imageSrc}
      crop={crop}
      zoom={zoom}
      aspect={cropAspect}
      rotation={0}
      minZoom={1}
      maxZoom={3}
      cropShape="rect"
      zoomSpeed={1}
      restrictPosition
      keyboardStep={1}
      style={cropperStyle}
      classes={{}}
      mediaProps={{}}
      cropperProps={{}}
      onCropChange={setCrop}
      onZoomChange={setZoom}
      onCropComplete={onCropComplete}
      onMediaLoaded={(mediaSize) => {
        if (aspectPreset === 'free') {
          setMediaAspect(mediaSize.naturalWidth / mediaSize.naturalHeight)
        }
      }}
    />
  ) : null

  const embeddedCropper = (
    <div className="relative min-h-0 overflow-hidden rounded-md bg-muted/30">{cropperNode}</div>
  )

  const standaloneCropper = (
    <div className="relative min-h-[20rem] flex-1 overflow-hidden rounded-md bg-muted/30">
      {cropperNode}
    </div>
  )

  const zoomControls = (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Zoom</p>
      <Slider
        min={1}
        max={3}
        step={0.05}
        value={[zoom]}
        onValueChange={(value) => setZoom(value[0] ?? 1)}
        aria-label="Crop zoom"
      />
    </div>
  )

  const cropBody = embedded ? (
    <div
      className={
        aspectControls
          ? 'grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3'
          : 'grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3'
      }
    >
      {aspectControls}
      {embeddedCropper}
      <div>
        {zoomControls}
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  ) : (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {aspectControls}
      {standaloneCropper}
      {zoomControls}
      {error ? <p className="shrink-0 text-sm text-destructive">{error}</p> : null}
    </div>
  )

  if (embedded) {
    if (!open) {
      return null
    }
    return cropBody
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      title="Crop Image"
      description="Drag to reposition. Use zoom and aspect ratio controls to adjust the crop area."
      icon={<Crop className="h-5 w-5" />}
      sizeWidth="large"
      sizeHeight="xlarge"
      disableContentScroll
      stackLevel={stackLevel}
      nestedDismissGuard={isProcessing}
      footer={footerActions}
    >
      {cropBody}
    </CustomDialog>
  )
  },
)
