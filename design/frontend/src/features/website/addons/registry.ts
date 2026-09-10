import { buttonAddonModule } from './button/ButtonAddon'
import { imageAddonModule } from './image/ImageAddon'
import { imageSliderAddonModule } from './imageSlider/ImageSliderAddon'
import { menuAddonModule } from './menu/MenuAddon'
import { textAddonModule } from './text/TextAddon'
import type { AddonModule } from './types'
import type { WebsiteAddon, WebsiteDesignerKind } from '../types'

const modules: AddonModule[] = [
  imageAddonModule,
  imageSliderAddonModule,
  textAddonModule,
  buttonAddonModule,
  menuAddonModule,
]

export function getAddonModules(kind?: WebsiteDesignerKind): AddonModule[] {
  if (!kind) return modules
  return modules.filter((module) => !module.allowedKinds || module.allowedKinds.includes(kind))
}

export function getAddonModulesForKind(kind?: WebsiteDesignerKind): Set<WebsiteAddon['type']> {
  return new Set(getAddonModules(kind).map((module) => module.type))
}

export function getAddonModuleByType(type: WebsiteAddon['type']): AddonModule | undefined {
  return modules.find((module) => module.type === type)
}
