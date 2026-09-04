import { useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Trash2 } from 'lucide-react'
import {
  Button,
  FormField,
  ImagePreview,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@webonone/ui-kit'
import { nanoid } from 'nanoid'
import { WebsiteImagePicker } from '../../components/WebsiteImagePicker'
import { emptyLayoutByBreakpoint } from '../../types'
import type { MediaRef, WebsiteAddon, WebsiteBreakpoint } from '../../types'
import { buildImageSliderPlaceholderSlides } from '../addonSamples'
import type { AddonModule, AddonPropsFieldsProps, AddonRenderProps } from '../types'

const AUTO_SLIDE_INTERVAL_MS = 5000
const PLACEHOLDER_AUTO_SLIDE_INTERVAL_MS = 3000
const EMPTY_SLIDES: MediaRef[] = []

function slidesForBreakpoint(
  imagesByBreakpoint: Extract<WebsiteAddon, { type: 'imageSlider' }>['props']['imagesByBreakpoint'],
  breakpoint: WebsiteBreakpoint,
): MediaRef[] {
  return (
    imagesByBreakpoint[breakpoint] ??
    imagesByBreakpoint['2xl'] ??
    imagesByBreakpoint.xl ??
    imagesByBreakpoint.lg ??
    imagesByBreakpoint.md ??
    imagesByBreakpoint.sm ??
    EMPTY_SLIDES
  )
}

function ImageSliderAddonRenderer({ addon, breakpoint, publish }: AddonRenderProps) {
  const { t } = useTranslation('website')
  const [activeIndex, setActiveIndex] = useState(0)

  const storedSlides =
    addon.type === 'imageSlider'
      ? slidesForBreakpoint(addon.props.imagesByBreakpoint, breakpoint)
      : []
  const addonId = addon.type === 'imageSlider' ? addon.id : ''
  const usingPlaceholders = storedSlides.length === 0 && addon.type === 'imageSlider'
  const slides = useMemo(() => {
    if (storedSlides.length > 0) return storedSlides
    if (addon.type !== 'imageSlider') return []
    return buildImageSliderPlaceholderSlides(addonId)
  }, [addon.type, addonId, storedSlides])

  const slideSignature = slides.map((slide) => slide.fileId).join('|')

  const autoSlide = addon.type === 'imageSlider' ? addon.props.autoSlide : false
  const showNavigationProp = addon.type === 'imageSlider' ? addon.props.showNavigation : false
  const fit = addon.type === 'imageSlider' ? addon.props.fit : 'cover'

  useEffect(() => {
    setActiveIndex(0)
  }, [slideSignature, breakpoint])

  useEffect(() => {
    if (slides.length < 2) return
    if (usingPlaceholders) {
      const timer = window.setInterval(() => {
        setActiveIndex((index) => (index + 1) % slides.length)
      }, PLACEHOLDER_AUTO_SLIDE_INTERVAL_MS)
      return () => window.clearInterval(timer)
    }
    if (!publish || !autoSlide) return
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length)
    }, AUTO_SLIDE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [autoSlide, publish, slides.length, usingPlaceholders])

  if (addon.type !== 'imageSlider') return null

  if (slides.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-muted-foreground/40 text-sm text-muted-foreground">
        {t('imageSlider')}
      </div>
    )
  }

  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)]!
  const canNavigate = slides.length > 1
  const showNavigation = showNavigationProp && canNavigate

  function goTo(index: number) {
    if (slides.length === 0) return
    const next = ((index % slides.length) + slides.length) % slides.length
    setActiveIndex(next)
  }

  function stopDesignerDrag(event: MouseEvent | PointerEvent) {
    event.stopPropagation()
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={activeSlide.url}
          alt=""
          className="h-full w-full"
          style={{ objectFit: fit }}
        />
        {showNavigation ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              data-addon-control=""
              className="absolute left-2 top-1/2 z-10 size-8 -translate-y-1/2 shadow-md"
              aria-label={t('previousSlide')}
              onPointerDown={stopDesignerDrag}
              onClick={(event) => {
                stopDesignerDrag(event)
                goTo(activeIndex - 1)
              }}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              data-addon-control=""
              className="absolute right-2 top-1/2 z-10 size-8 -translate-y-1/2 shadow-md"
              aria-label={t('nextSlide')}
              onPointerDown={stopDesignerDrag}
              onClick={(event) => {
                stopDesignerDrag(event)
                goTo(activeIndex + 1)
              }}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </>
        ) : null}
      </div>
      {showNavigation ? (
        <div
          className="flex shrink-0 items-center justify-center gap-1.5 py-2"
          data-addon-control=""
          onPointerDown={stopDesignerDrag}
        >
          {slides.map((slide, index) => {
            const selected = index === activeIndex
            return (
              <button
                key={slide.fileId}
                type="button"
                data-addon-control=""
                aria-label={t('goToSlide', { index: index + 1 })}
                aria-current={selected ? 'true' : undefined}
                className={`size-2 rounded-full transition ${
                  selected ? 'bg-primary' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                }`}
                onClick={(event) => {
                  stopDesignerDrag(event)
                  goTo(index)
                }}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function ImageSliderAddonPropsFields({
  addon,
  breakpoint,
  onChange,
  onNestedDialogOpenChange,
}: AddonPropsFieldsProps) {
  const { t } = useTranslation('website')
  const [pickerOpen, setPickerOpen] = useState(false)
  if (addon.type !== 'imageSlider') return null

  const sliderAddon = addon

  function setPicker(open: boolean) {
    setPickerOpen(open)
    onNestedDialogOpenChange?.(open)
  }

  const slides = sliderAddon.props.imagesByBreakpoint[breakpoint] ?? []
  const placeholderSlides = buildImageSliderPlaceholderSlides(sliderAddon.id)

  function updateSlides(nextSlides: MediaRef[]) {
    onChange({
      ...sliderAddon,
      props: {
        ...sliderAddon.props,
        imagesByBreakpoint: {
          ...sliderAddon.props.imagesByBreakpoint,
          [breakpoint]: nextSlides,
        },
      },
    })
  }

  function moveSlide(from: number, to: number) {
    if (to < 0 || to >= slides.length) return
    const next = [...slides]
    const [item] = next.splice(from, 1)
    if (!item) return
    next.splice(to, 0, item)
    updateSlides(next)
  }

  return (
    <>
      <FormField label={t('perBreakpointSlides')} htmlFor="image-slider-slides">
        <div id="image-slider-slides" className="space-y-2">
          {slides.length === 0 ? (
            <div className="space-y-2 rounded-md border border-dashed border-muted-foreground/40 p-3">
              <p className="text-xs text-muted-foreground">{t('sampleSlidesHint')}</p>
              <div className="flex flex-wrap gap-2">
                {placeholderSlides.map((slide) => (
                  <ImagePreview
                    key={slide.fileId}
                    src={slide.url}
                    alt={t('imageSlider')}
                    mode="view"
                    className="h-16 w-24 rounded-md"
                  />
                ))}
              </div>
            </div>
          ) : null}
          {slides.map((slide, index) => (
            <div key={slide.fileId} className="flex items-center gap-2">
              <ImagePreview
                src={slide.url}
                alt={slide.fileName ?? t('imageSlider')}
                mode="view"
                className="h-12 w-16 shrink-0 rounded-md"
              />
              <div className="flex shrink-0 flex-col gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-7"
                  aria-label={t('moveSlideUp')}
                  disabled={index === 0}
                  onClick={() => moveSlide(index, index - 1)}
                >
                  <ChevronUp className="size-3.5" aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-7"
                  aria-label={t('moveSlideDown')}
                  disabled={index === slides.length - 1}
                  onClick={() => moveSlide(index, index + 1)}
                >
                  <ChevronDown className="size-3.5" aria-hidden />
                </Button>
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="ml-auto size-8 shrink-0"
                aria-label={t('removeSlide')}
                onClick={() => updateSlides(slides.filter((_, slideIndex) => slideIndex !== index))}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" className="h-9 w-full" onClick={() => setPicker(true)}>
            {t('addSlide')}
          </Button>
        </div>
      </FormField>
      <Select
        value={sliderAddon.props.fit}
        onValueChange={(fit) =>
          onChange({
            ...sliderAddon,
            props: { ...sliderAddon.props, fit: fit as 'cover' | 'contain' },
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cover">{t('fitCover')}</SelectItem>
          <SelectItem value="contain">{t('fitContain')}</SelectItem>
        </SelectContent>
      </Select>
      <FormField label={t('showNavigation')} htmlFor="image-slider-show-navigation">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('showNavigationHint')}</p>
          <Switch
            id="image-slider-show-navigation"
            checked={sliderAddon.props.showNavigation}
            onCheckedChange={(checked) =>
              onChange({
                ...sliderAddon,
                props: { ...sliderAddon.props, showNavigation: checked },
              })
            }
          />
        </div>
      </FormField>
      <FormField label={t('autoSlide')} htmlFor="image-slider-auto-slide">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t('autoSlideHint')}</p>
          <Switch
            id="image-slider-auto-slide"
            checked={sliderAddon.props.autoSlide}
            onCheckedChange={(checked) =>
              onChange({
                ...sliderAddon,
                props: { ...sliderAddon.props, autoSlide: checked },
              })
            }
          />
        </div>
      </FormField>
      <WebsiteImagePicker
        open={pickerOpen}
        onClose={() => setPicker(false)}
        onSelect={(picked) => {
          updateSlides([...slides, picked])
          setPicker(false)
        }}
      />
    </>
  )
}

function createDefaultImageSliderAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'imageSlider',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 200, colSpan: 12 }),
    props: {
      imagesByBreakpoint: {},
      fit: 'cover',
      showNavigation: true,
      autoSlide: false,
    },
  }
}

export const imageSliderAddonModule: AddonModule = {
  type: 'imageSlider',
  labelKey: 'imageSlider',
  descriptionKey: 'imageSliderDescription',
  createDefaultAddon: createDefaultImageSliderAddon,
  RenderComponent: ImageSliderAddonRenderer,
  PropsFields: ImageSliderAddonPropsFields,
}
