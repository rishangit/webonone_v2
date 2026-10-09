import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { ImagePreview } from '../components/ImagePreview'
import { ItemListCard } from './ItemListCard'
import { itemListMenuClassName } from '../components/ItemList'
import { shapeImageFlushClassName } from '../lib/shape'

/** Pass to `ImagePreview` (or similar) inside collection card media — fills the top band. */
export const itemListCardImageClassName = cn(
  shapeImageFlushClassName,
  'h-full w-full max-h-none rounded-none border-0 shadow-none',
)

export function ItemListCardPlaceholderImage({ alt = '' }: { alt?: string }) {
  return <ImagePreview src={null} alt={alt} className={itemListCardImageClassName} />
}

export const itemListCardMediaClassName =
  'item-list-card-media aspect-[4/3] w-full overflow-hidden bg-muted [&>*]:h-full [&>*]:w-full [&>*]:max-h-none'

export const itemListCardMenuOverlayClassName = cn(
  'absolute right-1 top-1 z-10 rounded-md bg-background/80 shadow-sm backdrop-blur-sm',
  itemListMenuClassName,
)

export interface ItemListCollectionCardProps {
  /** Full-width media (usually `ImagePreview` with `itemListCardImageClassName`). */
  image: ReactNode
  /** Row actions — rendered in the top-right over the image. */
  menu?: ReactNode
  /** Detail block below the image. */
  children: ReactNode
  onBodyClick?: () => void
  className?: string
}

export function ItemListCollectionCard({
  image,
  menu,
  children,
  onBodyClick,
  className,
}: ItemListCollectionCardProps) {
  const navigableClassName =
    'w-full cursor-pointer border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring'

  const body = onBodyClick ? (
    <button type="button" className={cn(navigableClassName, 'rounded-md')} onClick={onBodyClick}>
      {children}
    </button>
  ) : (
    children
  )

  const media = onBodyClick ? (
    <button type="button" className={navigableClassName} onClick={onBodyClick}>
      <div className={itemListCardMediaClassName}>{image}</div>
    </button>
  ) : (
    <div className={itemListCardMediaClassName}>{image}</div>
  )

  return (
    <ItemListCard className={className}>
      <div className="relative w-full shrink-0">
        {media}
        {menu ? <div className={itemListCardMenuOverlayClassName}>{menu}</div> : null}
      </div>
      <div className="min-w-0 p-3">{body}</div>
    </ItemListCard>
  )
}
