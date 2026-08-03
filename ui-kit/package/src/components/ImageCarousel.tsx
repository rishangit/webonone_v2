import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { Button } from './Button'

export type ImageCarouselImage = {
  mediaId: string
  url: string
}

export type ImageCarouselProps = {
  images: ImageCarouselImage[]
  alt: string
}

export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const thumbStripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  useEffect(() => {
    const strip = thumbStripRef.current
    if (!strip) return
    const thumb = strip.querySelector<HTMLElement>(`[data-thumb-index="${String(activeIndex)}"]`)
    thumb?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
  }, [activeIndex])

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted"
        aria-label={alt}
      >
        <ImageIcon className="size-12 text-muted-foreground" aria-hidden />
      </div>
    )
  }

  const active = images[Math.min(activeIndex, images.length - 1)]!
  const canNavigate = images.length > 1

  function goTo(index: number) {
    if (images.length === 0) return
    const next = ((index % images.length) + images.length) % images.length
    setActiveIndex(next)
  }

  function scrollThumbs(direction: -1 | 1) {
    const strip = thumbStripRef.current
    if (!strip) return
    strip.scrollBy({ left: direction * Math.max(160, strip.clientWidth * 0.6), behavior: 'smooth' })
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
        <img
          src={active.url}
          alt={alt}
          className="aspect-[16/10] w-full object-cover"
        />
        {canNavigate ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 size-8 -translate-y-1/2 shadow-md"
              aria-label="Previous image"
              onClick={() => goTo(activeIndex - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 size-8 -translate-y-1/2 shadow-md"
              aria-label="Next image"
              onClick={() => goTo(activeIndex + 1)}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
            <p className="absolute bottom-2 right-2 rounded-md bg-background/85 px-2 py-0.5 text-xs font-medium text-foreground tabular-nums">
              {activeIndex + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>

      {canNavigate ? (
        <div className="relative">
          <div
            ref={thumbStripRef}
            className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="list"
            aria-label="Image thumbnails"
          >
            {images.map((image, index) => {
              const selected = index === activeIndex
              return (
                <button
                  key={image.mediaId}
                  type="button"
                  data-thumb-index={index}
                  role="listitem"
                  aria-label={`Show image ${String(index + 1)}`}
                  aria-current={selected ? 'true' : undefined}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-md border transition ${
                    selected
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <img
                    src={image.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              )
            })}
          </div>

          {images.length > 4 ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="absolute -left-1 top-1/2 size-7 -translate-y-1/2 bg-background shadow-sm"
                aria-label="Scroll thumbnails left"
                onClick={() => scrollThumbs(-1)}
              >
                <ChevronLeft className="size-3.5" aria-hidden />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="absolute -right-1 top-1/2 size-7 -translate-y-1/2 bg-background shadow-sm"
                aria-label="Scroll thumbnails right"
                onClick={() => scrollThumbs(1)}
              >
                <ChevronRight className="size-3.5" aria-hidden />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
