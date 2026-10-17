import { nanoid } from 'nanoid'
import { z } from 'zod'
import {
  websiteDocumentSchema,
  type WebsiteAddon,
  type WebsiteBlock,
  type WebsiteDocumentV1,
} from '../schemas/websiteDocument.schema.js'
import {
  websiteButtonStyleSchema,
  websiteColorTokenSchema,
  websiteFontTokenSchema,
  websiteTextStyleSchema,
  type WebsiteButtonStyle,
  type WebsiteColorToken,
  type WebsiteFontToken,
  type WebsiteTextStyle,
} from '../schemas/websiteThemes.schema.js'

export const COMPANY_NAME_TOKEN = '{{companyName}}'

export type FontLibrarySeed = {
  id: string
  name: string
  googleFontUrl: string
  family: string
  sortOrder: number
}

export type StarterTheme = {
  name: string
  pageBackground: string
  bodyTextColor: string
  fonts: WebsiteFontToken[]
  colors: WebsiteColorToken[]
  textStyles: WebsiteTextStyle[]
  buttonStyles: WebsiteButtonStyle[]
}

export type StarterPreset = {
  slug: string
  name: string
  document: WebsiteDocumentV1
}

export type StarterTemplate = {
  slug: string
  name: string
  theme: StarterTheme
  presets: StarterPreset[]
}

const starterThemeSchema = z.object({
  name: z.string().min(1),
  pageBackground: z.string().min(1),
  bodyTextColor: z.string().min(1),
  fonts: z.array(websiteFontTokenSchema).min(1),
  colors: z.array(websiteColorTokenSchema).min(1),
  textStyles: z.array(websiteTextStyleSchema).min(1),
  buttonStyles: z.array(websiteButtonStyleSchema).min(1),
})

const starterPresetSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  document: websiteDocumentSchema,
})

function googleFontUrl(family: string, weights = '400;700'): string {
  const query = encodeURIComponent(family).replace(/%20/g, '+')
  return `https://fonts.googleapis.com/css2?family=${query}:wght@${weights}&display=swap`
}

const FONT_NAMES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Raleway',
  'Source Sans 3',
  'Work Sans',
  'DM Sans',
  'Manrope',
  'Outfit',
  'Rubik',
  'Playfair Display',
  'Merriweather',
  'Lora',
  'Libre Baskerville',
  'Oswald',
  'Bebas Neue',
] as const

export const FONT_LIBRARY: FontLibrarySeed[] = FONT_NAMES.map((name, index) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  name,
  googleFontUrl: googleFontUrl(name, name === 'Bebas Neue' ? '400' : '400;700'),
  family: name,
  sortOrder: index + 1,
}))

const BODY_FONT = FONT_LIBRARY.find((font) => font.id === 'inter')!
const HEADING_FONT = FONT_LIBRARY.find((font) => font.id === 'playfair-display')!

const TEXT_COLOR = '#17211D'
const PRIMARY = '#344CE2'
const SURFACE = '#FFFFFF'

function layout(top: number, height: number, colSpan = 12) {
  return { '2xl': { col: 1, colSpan, top, height } }
}

function textAddon(input: {
  id: string
  zIndex: number
  top: number
  height: number
  colSpan?: number
  textStyleId: string
  content: string
  font: FontLibrarySeed
  size: number
}): WebsiteAddon {
  return {
    id: input.id,
    type: 'text',
    zIndex: input.zIndex,
    layout: layout(input.top, input.height, input.colSpan),
    props: {
      textStyleId: input.textStyleId,
      content: input.content,
      snapshot: {
        fontFamily: input.font.family,
        googleFontUrl: input.font.googleFontUrl,
        size: input.size,
        color: TEXT_COLOR,
      },
    },
  }
}

function contentBlock(id: string, height: number, addons: WebsiteAddon[]): WebsiteBlock {
  return {
    id,
    zIndex: 0,
    layout: layout(0, height),
    addons,
    children: [],
  }
}

function document(height: number, block: WebsiteBlock): WebsiteDocumentV1 {
  return websiteDocumentSchema.parse({
    version: 1,
    container: { height },
    blocks: [block],
  })
}

function buildTheme(): StarterTheme {
  return starterThemeSchema.parse({
    name: 'Default',
    pageBackground: '#EFF3FA',
    bodyTextColor: TEXT_COLOR,
    fonts: [
      {
        id: 'font-body',
        name: BODY_FONT.name,
        googleFontUrl: BODY_FONT.googleFontUrl,
        family: BODY_FONT.family,
      },
      {
        id: 'font-heading',
        name: HEADING_FONT.name,
        googleFontUrl: HEADING_FONT.googleFontUrl,
        family: HEADING_FONT.family,
      },
    ],
    colors: [
      { id: 'primary', name: 'Primary', value: PRIMARY },
      { id: 'secondary', name: 'Secondary', value: '#3578E8' },
      { id: 'text', name: 'Text', value: TEXT_COLOR },
      { id: 'background', name: 'Background', value: '#EFF3FA' },
      { id: 'surface', name: 'Surface', value: SURFACE },
    ],
    textStyles: [
      { id: 'text-heading', name: 'Heading', fontId: 'font-heading', size: 48, colorId: 'text' },
      { id: 'text-body', name: 'Body', fontId: 'font-body', size: 18, colorId: 'text' },
    ],
    buttonStyles: [
      {
        id: 'button-primary',
        name: 'Primary',
        backgroundColorId: 'primary',
        textColorId: 'surface',
        textStyleId: 'text-body',
        borderColorId: 'primary',
        borderWidth: 0,
        radius: 6,
      },
    ],
  })
}

function buildPresets(): StarterPreset[] {
  const header = document(
    160,
    contentBlock('block-header', 140, [
      textAddon({
        id: 'addon-header-title',
        zIndex: 1,
        top: 16,
        height: 48,
        textStyleId: 'text-heading',
        content: COMPANY_NAME_TOKEN,
        font: HEADING_FONT,
        size: 28,
      }),
      {
        id: 'addon-header-menu',
        type: 'menu',
        zIndex: 2,
        layout: layout(72, 48),
        props: {
          displayByBreakpoint: { '2xl': { mode: 'inline', align: 'start' } },
          items: [
            {
              id: 'nav-home',
              label: 'Home',
              textStyleId: 'text-body',
              linkPageId: null,
              children: [],
            },
          ],
        },
      },
    ]),
  )

  const footer = document(
    120,
    contentBlock('block-footer', 80, [
      textAddon({
        id: 'addon-footer-line',
        zIndex: 1,
        top: 24,
        height: 40,
        textStyleId: 'text-body',
        content: `© ${COMPANY_NAME_TOKEN}`,
        font: BODY_FONT,
        size: 14,
      }),
    ]),
  )

  const welcome = document(
    640,
    contentBlock('block-welcome', 360, [
      textAddon({
        id: 'addon-welcome-heading',
        zIndex: 1,
        top: 48,
        height: 72,
        textStyleId: 'text-heading',
        content: COMPANY_NAME_TOKEN,
        font: HEADING_FONT,
        size: 48,
      }),
      textAddon({
        id: 'addon-welcome-body',
        zIndex: 2,
        top: 132,
        height: 56,
        textStyleId: 'text-body',
        content: `Welcome to ${COMPANY_NAME_TOKEN}.`,
        font: BODY_FONT,
        size: 18,
      }),
      {
        id: 'addon-welcome-button',
        type: 'button',
        zIndex: 3,
        layout: layout(208, 48, 4),
        props: {
          buttonStyleId: 'button-primary',
          label: 'Get in touch',
          linkPageId: null,
          snapshot: {
            background: PRIMARY,
            textColor: SURFACE,
            borderColor: 'transparent',
            borderWidth: 0,
            radius: 6,
            fontFamily: BODY_FONT.family,
            googleFontUrl: BODY_FONT.googleFontUrl,
            fontSize: 16,
          },
        },
      },
    ]),
  )

  return [
    starterPresetSchema.parse({ slug: 'site-header', name: 'Site header', document: header }),
    starterPresetSchema.parse({ slug: 'site-footer', name: 'Site footer', document: footer }),
    starterPresetSchema.parse({ slug: 'welcome', name: 'Welcome', document: welcome }),
  ]
}

export function buildStarterTemplate(): StarterTemplate {
  return {
    slug: 'default',
    name: 'Default',
    theme: buildTheme(),
    presets: buildPresets(),
  }
}

function mapAddons(block: WebsiteBlock, mapAddon: (addon: WebsiteAddon) => WebsiteAddon): WebsiteBlock {
  return {
    ...block,
    addons: block.addons.map(mapAddon),
    children: block.children.map((child) => mapAddons(child, mapAddon)),
  }
}

export function replaceCompanyName(document: WebsiteDocumentV1, companyName: string): WebsiteDocumentV1 {
  const next = {
    ...document,
    blocks: document.blocks.map((block) =>
      mapAddons(block, (addon) => {
        if (addon.type === 'text') {
          return {
            ...addon,
            props: {
              ...addon.props,
              content: addon.props.content.replaceAll(COMPANY_NAME_TOKEN, companyName),
            },
          }
        }
        return addon
      }),
    ),
  }
  return websiteDocumentSchema.parse(next)
}

function cloneAddon(addon: WebsiteAddon): WebsiteAddon {
  if (addon.type !== 'menu') return { ...addon, id: nanoid(10) }
  return {
    ...addon,
    id: nanoid(10),
    props: {
      ...addon.props,
      items: addon.props.items.map((item) => ({
        ...item,
        id: nanoid(10),
        children: item.children.map((child) => ({ ...child, id: nanoid(10) })),
      })),
    },
  }
}

function cloneBlock(block: WebsiteBlock): WebsiteBlock {
  return {
    ...block,
    id: nanoid(10),
    addons: block.addons.map(cloneAddon),
    children: block.children.map(cloneBlock),
  }
}

/** Copy a preset the same way the designer inserts one: new ids, same elements and addons. */
export function copyPresetDocument(document: WebsiteDocumentV1): WebsiteDocumentV1 {
  return websiteDocumentSchema.parse({
    ...document,
    blocks: document.blocks.map(cloneBlock),
  })
}

export function linkHomeMenu(document: WebsiteDocumentV1, homePageId: string): WebsiteDocumentV1 {
  const next = {
    ...document,
    blocks: document.blocks.map((block) =>
      mapAddons(block, (addon) => {
        if (addon.type !== 'menu') return addon
        return {
          ...addon,
          props: {
            ...addon.props,
            items: addon.props.items.map((item) =>
              item.label === 'Home' ? { ...item, linkPageId: homePageId } : item,
            ),
          },
        }
      }),
    ),
  }
  return websiteDocumentSchema.parse(next)
}
