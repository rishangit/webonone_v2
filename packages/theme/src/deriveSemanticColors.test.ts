import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { FIXED_TYPOGRAPHY, PLATFORM_DEFAULT_THEME, createPlatformDefaultThemeDto } from './constants'
import { deriveSemanticColors } from './deriveSemanticColors'
import { meetsContrast } from './colorUtils'
import { themeDtoToColors } from './themeMapper'

const defaultColors = themeDtoToColors(createPlatformDefaultThemeDto())

describe('deriveSemanticColors', () => {
  it('derives light mode tokens from platform default', () => {
    const semantic = deriveSemanticColors(defaultColors, 'light')

    assert.equal(semantic.primary, defaultColors.primary)
    assert.equal(semantic.background, defaultColors.background)
    assert.equal(semantic.surface, defaultColors.surface)
    assert.equal(semantic.text, FIXED_TYPOGRAPHY.light.body)
    assert.equal(semantic.textTitle, FIXED_TYPOGRAPHY.light.title)
    assert.equal(semantic.textDescription, FIXED_TYPOGRAPHY.light.description)
    assert.equal(semantic.textLabel, FIXED_TYPOGRAPHY.light.label)
    assert.ok(semantic.primaryHover)
    assert.ok(semantic.borderFocus)
    assert.ok(semantic.success)
    assert.ok(semantic.errorBackground)
  })

  it('keeps fixed typography when user text color changes', () => {
    const custom = { ...defaultColors, text: '#FF00FF' }
    const semantic = deriveSemanticColors(custom, 'light')
    assert.equal(semantic.text, FIXED_TYPOGRAPHY.light.body)
    assert.equal(semantic.textTitle, FIXED_TYPOGRAPHY.light.title)
    assert.notEqual(semantic.text, custom.text)
  })

  it('ensures primary button text is readable', () => {
    const semantic = deriveSemanticColors(defaultColors, 'light')
    assert.ok(meetsContrast(semantic.primaryText, semantic.primary))
  })

  it('derives darker surfaces and lighter text in dark mode', () => {
    const light = deriveSemanticColors(defaultColors, 'light')
    const dark = deriveSemanticColors(defaultColors, 'dark')

    assert.notEqual(dark.background, light.background)
    assert.notEqual(dark.surface, light.surface)
    assert.notEqual(dark.text, light.text)

    const lightBgL = parseInt(light.background.slice(1, 3), 16)
    const darkBgL = parseInt(dark.background.slice(1, 3), 16)
    assert.ok(darkBgL < lightBgL)

    const lightTextL = parseInt(light.text.slice(1, 3), 16)
    const darkTextL = parseInt(dark.text.slice(1, 3), 16)
    assert.ok(darkTextL > lightTextL)
  })

  it('includes status tokens in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const semantic = deriveSemanticColors(defaultColors, mode)
      assert.ok(semantic.success)
      assert.ok(semantic.warningBackground)
      assert.ok(semantic.infoBorder)
      assert.ok(semantic.error)
    }
  })

  it('maps theme dto columns to semantic slots', () => {
    const colors = themeDtoToColors(PLATFORM_DEFAULT_THEME)
    assert.equal(colors.primary, PLATFORM_DEFAULT_THEME.color1)
    assert.equal(colors.secondary, PLATFORM_DEFAULT_THEME.color2)
    assert.equal(colors.text, PLATFORM_DEFAULT_THEME.color3)
    assert.equal(colors.background, PLATFORM_DEFAULT_THEME.color4)
    assert.equal(colors.surface, PLATFORM_DEFAULT_THEME.color5)
  })
})
