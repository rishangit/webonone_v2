import type { ComponentType } from 'react'
import type {
  WebsiteAddon,
  WebsiteBreakpoint,
  WebsitePage,
  WebsiteTheme,
} from '../types'

export interface AddonRenderProps {
  addon: WebsiteAddon
  breakpoint: WebsiteBreakpoint
  theme?: WebsiteTheme | null
  pages?: Pick<WebsitePage, 'id' | 'path' | 'name'>[]
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
  createDefaultAddon: (zIndex: number) => WebsiteAddon
  RenderComponent: ComponentType<AddonRenderProps>
  PropsFields: ComponentType<AddonPropsFieldsProps>
}
