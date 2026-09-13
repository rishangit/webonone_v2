import type { ComponentType } from 'react'
import type {
  DesignerSelection,
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsiteDataset,
  WebsiteDesignerKind,
  WebsitePage,
  WebsiteTheme,
} from '../types'

export interface AddonRenderProps {
  addon: WebsiteAddon
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  pages?: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  currentPageId?: string | null
  companyId?: string
  interactive: boolean
  publish: boolean
  /** Dataset rows keyed by dataset id — used by content slider in publish/preview. */
  datasetItemsById?: Record<string, Record<string, unknown>[]>
  /**
   * Ambient parent row when this addon is rendered under an inherited owner
   * (e.g. product row inside an outer products slider).
   */
  parentDataItem?: Record<string, unknown> | null
  /** Host template block `dataBinding.itemsPath` fallback for parent-path sliders. */
  hostItemsPath?: string | null
  /** Host content block id when rendering inside the designer canvas. */
  hostBlockId?: string
  selection?: DesignerSelection | null
  canManage?: boolean
  onSelect?: (selection: DesignerSelection) => void
  onMovePointerDown?: (event: import('react').PointerEvent, grabbed: DesignerSelection) => void
  onResizePointerDown?: (
    event: import('react').PointerEvent,
    handle: import('../document/layout').ResizeHandle,
    grabbed: DesignerSelection,
  ) => void
  onOpenTemplateBlockSettings?: (templateBlockId: string) => void
  onOpenTemplateAddonSettings?: (templateBlockId: string, templateAddonId: string) => void
  onLayerTemplateBlock?: (templateBlockId: string, direction: 'up' | 'down') => void
  onDeleteTemplateBlock?: (templateBlockId: string) => void
  onDuplicateTemplateBlock?: (templateBlockId: string) => void
  onLayerTemplateAddon?: (templateBlockId: string, templateAddonId: string, direction: 'up' | 'down') => void
  onDeleteTemplateAddon?: (templateBlockId: string, templateAddonId: string) => void
  onNavigatePage?: (path: string) => void
  /** Open AddAddonDialog to insert children into a slider slide template. */
  onAddChild?: () => void
}

export interface AddonPropsFieldsProps {
  addon: WebsiteAddon
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  onChange: (addon: WebsiteAddon) => void
  onNestedDialogOpenChange?: (open: boolean) => void
  /** When true, this addon sits under a parent dataset owner (slider/block). */
  inheritedFromParent?: boolean
  parentDataset?: WebsiteDataset | null
}

export interface AddonModule {
  type: WebsiteAddon['type']
  labelKey: string
  descriptionKey: string
  allowedKinds?: WebsiteDesignerKind[]
  createDefaultAddon: (zIndex: number) => WebsiteAddon
  RenderComponent: ComponentType<AddonRenderProps>
  PropsFields: ComponentType<AddonPropsFieldsProps>
  /**
   * Dataset-owner addons (e.g. content slider) own their row source on the
   * Data Binding tab. When set, AddonSettingsDialog renders this instead of
   * field-mapper AddonDataBindingFields.
   */
  DataBindingFields?: ComponentType<AddonPropsFieldsProps>
}
