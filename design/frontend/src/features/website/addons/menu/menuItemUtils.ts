import { nanoid } from 'nanoid'
import type {
  MenuAddonProps,
  MenuBreakpointSettings,
  MenuItem,
  WebsiteBreakpoint,
} from '../../types'
import { WEBSITE_BREAKPOINTS } from '../../types'

const BREAKPOINT_FALLBACK_ORDER: WebsiteBreakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm']

export function createMenuItem(label = 'Menu item'): MenuItem {
  return {
    id: nanoid(10),
    label,
    textStyleId: '',
    linkPageId: null,
    children: [],
  }
}

export function updateMenuItem(items: MenuItem[], itemId: string, patch: Partial<MenuItem>): MenuItem[] {
  return items.map((item) => {
    if (item.id === itemId) return { ...item, ...patch }
    if (item.children.length === 0) return item
    return { ...item, children: updateMenuItem(item.children, itemId, patch) }
  })
}

export function removeMenuItem(items: MenuItem[], itemId: string): MenuItem[] {
  return items
    .filter((item) => item.id !== itemId)
    .map((item) => ({
      ...item,
      children: item.children.filter((child) => child.id !== itemId),
    }))
}

export function moveMenuItem(items: MenuItem[], itemId: string, direction: -1 | 1): MenuItem[] {
  const index = items.findIndex((item) => item.id === itemId)
  if (index >= 0) {
    const next = index + direction
    if (next < 0 || next >= items.length) return items
    const copy = [...items]
    const [moved] = copy.splice(index, 1)
    copy.splice(next, 0, moved)
    return copy
  }

  return items.map((item) => {
    const childIndex = item.children.findIndex((child) => child.id === itemId)
    if (childIndex < 0) return item
    const next = childIndex + direction
    if (next < 0 || next >= item.children.length) return item
    const children = [...item.children]
    const [moved] = children.splice(childIndex, 1)
    children.splice(next, 0, moved)
    return { ...item, children }
  })
}

export function addSubItem(items: MenuItem[], parentId: string): MenuItem[] {
  return items.map((item) => {
    if (item.id !== parentId) return item
    return {
      ...item,
      children: [...item.children, createMenuItem('Sub item')],
    }
  })
}

export function resolveMenuSettings(
  props: MenuAddonProps,
  breakpoint: WebsiteBreakpoint,
): MenuBreakpointSettings {
  const startIndex = BREAKPOINT_FALLBACK_ORDER.indexOf(breakpoint)
  for (let index = startIndex; index < BREAKPOINT_FALLBACK_ORDER.length; index += 1) {
    const key = BREAKPOINT_FALLBACK_ORDER[index]
    const settings = props.displayByBreakpoint[key]
    if (settings) {
      return {
        mode: settings.mode,
        align: settings.align,
        panelSide: settings.mode === 'hamburger' ? settings.panelSide ?? 'right' : undefined,
      }
    }
  }

  return { mode: 'inline', align: 'start' }
}

export function updateMenuBreakpointSettings(
  props: MenuAddonProps,
  breakpoint: WebsiteBreakpoint,
  patch: Partial<MenuBreakpointSettings>,
): MenuAddonProps {
  const current = props.displayByBreakpoint[breakpoint] ?? resolveMenuSettings(props, breakpoint)
  const next: MenuBreakpointSettings = { ...current, ...patch }
  if (next.mode !== 'hamburger') {
    delete next.panelSide
  } else if (!next.panelSide) {
    next.panelSide = 'right'
  }
  return {
    ...props,
    displayByBreakpoint: {
      ...props.displayByBreakpoint,
      [breakpoint]: next,
    },
  }
}

export function collectMenuTextStyleIds(items: MenuItem[]): string[] {
  const ids: string[] = []
  for (const item of items) {
    if (item.textStyleId) ids.push(item.textStyleId)
    for (const child of item.children) {
      if (child.textStyleId) ids.push(child.textStyleId)
    }
  }
  return ids
}

export const MENU_BREAKPOINTS = WEBSITE_BREAKPOINTS
