import { nanoid } from '@/features/design/website/nanoid'
import { createEmptySlideTemplate, DEFAULT_SLIDER_DISPLAY_SETTINGS } from '@/features/design/website/document/slider'
import { emptyLayoutByBreakpoint } from '@/features/design/website/types'
import type { WebsiteAddon, WebsiteDesignerKind } from '@/features/design/website/types'

export function createDefaultImageAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'image',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 80, colSpan: 12 }),
    props: { mediaByBreakpoint: {}, fit: 'cover', heightMode: 'auto' },
  }
}

export function createDefaultTextAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'text',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 72, colSpan: 12 }),
    props: {
      textStyleId: '',
      content: 'Text',
      snapshot: { fontFamily: 'inherit', size: 16, color: '#111827' },
    },
  }
}

export function createDefaultButtonAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'button',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 80, colSpan: 4 }),
    props: {
      buttonStyleId: '',
      label: 'Button',
      linkPageId: null,
      snapshot: {
        background: '#111827',
        textColor: '#ffffff',
        borderColor: 'transparent',
        borderWidth: 0,
        radius: 6,
        fontFamily: 'inherit',
        fontSize: 16,
      },
    },
  }
}

export function createDefaultSliderAddon(zIndex: number): WebsiteAddon {
  return {
    id: nanoid(10),
    type: 'slider',
    zIndex,
    layout: emptyLayoutByBreakpoint({ top: 8, height: 240, colSpan: 12 }),
    props: {
      slideTemplate: createEmptySlideTemplate(),
      sourcePresetId: null,
      dataSource: 'manual',
      datasetId: null,
      itemGroup: null,
      itemsPath: null,
      manualSlides: [],
      displayByBreakpoint: {
        '2xl': { ...DEFAULT_SLIDER_DISPLAY_SETTINGS },
      },
    },
  }
}

export function createDefaultMenuAddon(zIndex: number): WebsiteAddon {
  const parentId = nanoid(10)
  const childId = nanoid(10)
  return {
    id: nanoid(10),
    type: 'menu',
    zIndex,
    layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 12, top: 8, height: 48 }),
    props: {
      displayByBreakpoint: {
        '2xl': { mode: 'inline', align: 'start' },
      },
      items: [
        {
          id: parentId,
          label: 'Home',
          textStyleId: '',
          linkPageId: null,
          children: [],
        },
        {
          id: nanoid(10),
          label: 'More',
          textStyleId: '',
          linkPageId: null,
          children: [
            {
              id: childId,
              label: 'About',
              textStyleId: '',
              linkPageId: null,
              children: [],
            },
          ],
        },
      ],
    },
  }
}

export const ADDON_DEFAULTS: Record<WebsiteAddon['type'], (zIndex: number) => WebsiteAddon> = {
  image: createDefaultImageAddon,
  text: createDefaultTextAddon,
  button: createDefaultButtonAddon,
  slider: createDefaultSliderAddon,
  menu: createDefaultMenuAddon,
}

export function addonTypesForKind(_kind?: WebsiteDesignerKind): WebsiteAddon['type'][] {
  return Object.keys(ADDON_DEFAULTS) as WebsiteAddon['type'][]
}
