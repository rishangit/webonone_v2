import type { ComponentType } from 'react'
import type {
  WebsiteAddon,
  WebsiteBreakpoint,
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
  onNavigatePage?: (path: string) => void
}

export interface AddonPropsFieldsProps {
  addon: WebsiteAddon
  breakpoint: WebsiteBreakpoint
  theme: WebsiteTheme | null
  pages: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
  onChange: (addon: WebsiteAddon) => void
  onNestedDialogOpenChange?: (open: boolean) => void
}

export interface AddonModule {
  type: WebsiteAddon['type']
  labelKey: string
  descriptionKey: string
  allowedKinds?: WebsiteDesignerKind[]
  createDefaultAddon: (zIndex: number) => WebsiteAddon
  RenderComponent: ComponentType<AddonRenderProps>
  PropsFields: ComponentType<AddonPropsFieldsProps>
}
