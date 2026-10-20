import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WebsiteButtonLibraryItem, WebsiteTextLibraryItem, WebsiteTheme } from '../types'
import { materializeButtonLibraryItem, materializeTextLibraryItem } from './themeLibraryMaterialize'

function emptyTheme(): WebsiteTheme {
  return {
    id: 'theme-1',
    companyId: 'co-1',
    name: 'Theme',
    pageBackground: '#ffffff',
    bodyTextColor: '#111827',
    isActive: true,
    isDefault: false,
    isLocked: false,
    sourceLibraryId: null,
    fonts: [],
    colorPaletteId: '',
    pageBackgroundIndex: 1,
    surfaceIndex: 1,
    bodyTextIndex: 1,
    accent1Index: 1,
    accent2Index: 1,
    colorPalettes: [],
    textStyles: [],
    buttonStyles: [],
    createdBy: null,
    createdAt: '',
    updatedAt: '',
  }
}

function libraryItem(): WebsiteButtonLibraryItem {
  return {
    id: 'lib-button-primary',
    name: 'Primary',
    sortOrder: 0,
    definition: {
      backgroundColorName: 'Blue',
      backgroundColorValue: '#344CE2',
      textColorName: 'White',
      textColorValue: '#FFFFFF',
      borderColorName: 'Blue',
      borderColorValue: '#344CE2',
      borderWidth: 0,
      radius: 10,
      textStyleName: 'Button label',
      textFontName: 'Inter',
      textGoogleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
      textFontFamily: 'Inter',
      textSize: 18,
      labelColorName: 'White',
      labelColorValue: '#FFFFFF',
      customization: {
        html: '<button class="website-element-root website-el-lib-button-primary">{{label}}</button>',
        styles: '.website-el-lib-button-primary {\n}\n',
        scripts: '',
      },
    },
  }
}

describe('materializeButtonLibraryItem', () => {
  it('records the library item id and remaps the element class', () => {
    const { buttonStyle } = materializeButtonLibraryItem(emptyTheme(), libraryItem())
    assert.equal(buttonStyle.sourceLibraryId, 'lib-button-primary')
    assert.notEqual(buttonStyle.id, 'lib-button-primary')
    assert.match(buttonStyle.customization?.html ?? '', new RegExp(`website-el-${buttonStyle.id}`))
    assert.doesNotMatch(buttonStyle.customization?.html ?? '', /website-el-lib-button-primary/)
    assert.match(buttonStyle.customization?.styles ?? '', new RegExp(`website-el-${buttonStyle.id}`))
  })

  it('keeps the theme button id when downloading an update', () => {
    const { buttonStyle } = materializeButtonLibraryItem(emptyTheme(), libraryItem(), {
      keepId: 'btn-keep',
      keepTextStyleId: 'txt-keep',
    })
    assert.equal(buttonStyle.id, 'btn-keep')
    assert.equal(buttonStyle.textStyleId, 'txt-keep')
    assert.equal(buttonStyle.sourceLibraryId, 'lib-button-primary')
    assert.match(buttonStyle.customization?.html ?? '', /website-el-btn-keep/)
  })
})

function textLibraryItem(): WebsiteTextLibraryItem {
  return {
    id: 'lib-text-heading',
    name: 'Heading',
    sortOrder: 0,
    definition: {
      fontName: 'Inter',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
      family: 'Inter',
      colorName: 'Text',
      colorValue: '#111827',
      size: 32,
      customization: {
        html: '<p class="website-element-root website-el-lib-text-heading">{{content}}</p>',
        styles: '.website-el-lib-text-heading {\n}\n',
        scripts: '',
      },
    },
  }
}

describe('materializeTextLibraryItem', () => {
  it('records the library item id when adding a text style from the library', () => {
    const { textStyle } = materializeTextLibraryItem(emptyTheme(), textLibraryItem())
    assert.equal(textStyle.sourceLibraryId, 'lib-text-heading')
    assert.notEqual(textStyle.id, 'lib-text-heading')
    assert.match(textStyle.customization?.html ?? '', new RegExp(`website-el-${textStyle.id}`))
  })

  it('keeps the theme text style id when downloading an update', () => {
    const { textStyle } = materializeTextLibraryItem(emptyTheme(), textLibraryItem(), { keepId: 'txt-keep' })
    assert.equal(textStyle.id, 'txt-keep')
    assert.equal(textStyle.sourceLibraryId, 'lib-text-heading')
    assert.match(textStyle.customization?.html ?? '', /website-el-txt-keep/)
  })
})
