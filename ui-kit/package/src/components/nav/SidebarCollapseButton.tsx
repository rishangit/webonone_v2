import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { interactiveHoverClassName } from '../../lib/selectionStyles'
import { cn } from '../../lib/utils'

interface SidebarCollapseButtonProps {
  collapsed: boolean
  onClick: () => void
  className?: string
}

function SidebarCollapseButton({ collapsed, onClick, className }: SidebarCollapseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-center ui-shape-control p-2 text-label transition-colors',
        interactiveHoverClassName,
        className,
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
    </button>
  )
}

export { SidebarCollapseButton }
export type { SidebarCollapseButtonProps }
