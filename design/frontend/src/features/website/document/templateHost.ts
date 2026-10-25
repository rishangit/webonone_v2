import type { WebsiteAddon, WebsiteBlock } from '../types'

/** Slider and list add-ons both host one child template that repeats per row. */
export type TemplateHostAddon = Extract<WebsiteAddon, { type: 'slider' | 'list' }>

export function isTemplateHost(addon: WebsiteAddon): addon is TemplateHostAddon {
  return addon.type === 'slider' || addon.type === 'list'
}

export function readHostTemplate(addon: WebsiteAddon): WebsiteBlock | null {
  if (addon.type === 'slider') return addon.props.slideTemplate
  if (addon.type === 'list') return addon.props.itemTemplate
  return null
}

export function writeHostTemplate(addon: TemplateHostAddon, template: WebsiteBlock | null): TemplateHostAddon {
  if (addon.type === 'slider') {
    return { ...addon, props: { ...addon.props, slideTemplate: template } }
  }
  return { ...addon, props: { ...addon.props, itemTemplate: template } }
}

/** Stable key on a parent row for a nested list or repeating block that has no itemsPath. */
export function nestedItemsKey(ownerId: string): string {
  return `listItems:${ownerId}`
}
