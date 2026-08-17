import { buttonAddonModule } from './button/ButtonAddon'
import { imageAddonModule } from './image/ImageAddon'
import { textAddonModule } from './text/TextAddon'
import type { AddonModule } from './types'
import type { WebsiteAddon } from '../types'

const modules: AddonModule[] = [imageAddonModule, textAddonModule, buttonAddonModule]

export function getAddonModules(): AddonModule[] {
  return modules
}

export function getAddonModuleByType(type: WebsiteAddon['type']): AddonModule | undefined {
  return modules.find((module) => module.type === type)
}
