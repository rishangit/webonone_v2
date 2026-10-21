import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint, type WebsiteButtonStyle, type WebsiteTextStyle, type WebsiteTheme } from '../types'
import { buttonStyleAtIndex, snapshotDocument, textStyleAtIndex } from './theme'

function textStyle(id: string, name: string): WebsiteTextStyle {
  return { id, name, fontId: '', size: 16, colorIndex: 1 }
}

function themeWith(styles: WebsiteTextStyle[]): WebsiteTheme {
  return {
    id: 'theme-1',
    companyId: 'co-1',
    name: 'Theme',
    pageBackground: '#ffffff',
    bodyTextColor: '#111827',
    isActive: true,
    isDefault: false,
    sourceLibraryId: null,
    fonts: [],
    colorPaletteId: '',
    pageBackgroundIndex: 1,
    surfaceIndex: 1,
    bodyTextIndex: 1,
    accent1Index: 1,
    accent2Index: 1,
    colorPalettes: [],
    textStyles: styles,
    buttonStyles: [],
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  }
}

describe('textStyleAtIndex', () => {
  const ocean = themeWith([textStyle('ocean-heading', 'Heading'), textStyle('ocean-body', 'Body')])
  const forest = themeWith([textStyle('forest-heading', 'Heading'), textStyle('forest-body', 'Body')])

  it('uses the saved position when the theme text list changes', () => {
    assert.equal(textStyleAtIndex(ocean, 1, 'ocean-body')?.id, 'ocean-body')
    assert.equal(textStyleAtIndex(forest, 1, 'ocean-body')?.id, 'forest-body')
  })

  it('falls back to the style id when no index is stored', () => {
    assert.equal(textStyleAtIndex(ocean, null, 'ocean-heading')?.id, 'ocean-heading')
    assert.equal(textStyleAtIndex(forest, null, 'ocean-heading'), undefined)
  })

  it('writes the theme text position when the document is saved', () => {
    const saved = snapshotDocument(
      {
        version: 1,
        container: { height: 640 },
        blocks: [
          {
            id: 'block-1',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint(),
            children: [],
            addons: [
              {
                id: 'text-1',
                type: 'text',
                zIndex: 0,
                layout: emptyLayoutByBreakpoint(),
                props: {
                  textStyleId: 'ocean-body',
                  content: 'Hello',
                  snapshot: { fontFamily: 'inherit', size: 16, color: '#111827' },
                },
              },
            ],
          },
        ],
      },
      ocean,
    )
    const props = saved.blocks[0]?.addons[0]
    assert.equal(props?.type === 'text' ? props.props.textStyleIndex : null, 1)
  })
})

function buttonStyle(id: string, name: string): WebsiteButtonStyle {
  return {
    id,
    name,
    backgroundColorIndex: 1,
    textColorIndex: 1,
    textStyleId: '',
    borderColorIndex: 1,
    borderWidth: 0,
    radius: 6,
  }
}

describe('buttonStyleAtIndex', () => {
  const ocean = themeWith([])
  ocean.buttonStyles = [buttonStyle('ocean-primary', 'Primary'), buttonStyle('ocean-ghost', 'Ghost')]
  const forest = themeWith([])
  forest.buttonStyles = [buttonStyle('forest-primary', 'Primary'), buttonStyle('forest-ghost', 'Ghost')]

  it('uses the saved position when the theme button list changes', () => {
    assert.equal(buttonStyleAtIndex(ocean, 1, 'ocean-ghost')?.id, 'ocean-ghost')
    assert.equal(buttonStyleAtIndex(forest, 1, 'ocean-ghost')?.id, 'forest-ghost')
  })

  it('writes the theme button position when the document is saved', () => {
    const saved = snapshotDocument(
      {
        version: 1,
        container: { height: 640 },
        blocks: [
          {
            id: 'block-1',
            zIndex: 0,
            layout: emptyLayoutByBreakpoint(),
            children: [],
            addons: [
              {
                id: 'button-1',
                type: 'button',
                zIndex: 0,
                layout: emptyLayoutByBreakpoint(),
                props: {
                  buttonStyleId: 'ocean-ghost',
                  label: 'Go',
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
              },
            ],
          },
        ],
      },
      ocean,
    )
    const props = saved.blocks[0]?.addons[0]
    assert.equal(props?.type === 'button' ? props.props.buttonStyleIndex : null, 1)
  })
})
