import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WebsiteTheme } from '../types'
import {
  chromeBoxStyle,
  chromeClassName,
  chromeColorSlotId,
  chromeInlineStyle,
  pickElementChrome,
} from './chrome.ts'

describe('element chrome helpers', () => {
  it('maps padding, radius, and shadow to Tailwind classes without margin classes', () => {
    assert.equal(
      chromeClassName({ padding: 2, margin: 4, borderRadius: 'lg', boxShadow: 'md' }),
      'p-2 rounded-lg shadow-md',
    )
  })

  it('insets absolute layout for margin so slot width does not grow', () => {
    const style = chromeBoxStyle(
      { col: 1, colSpan: 6, top: 32, height: 160 },
      { margin: 2 },
    )
    assert.equal(style.top, '40px')
    assert.equal(style.height, '144px')
    assert.equal(style.left, 'calc(0% + 8px)')
    assert.equal(style.width, 'calc(50% - 16px)')
  })

  it('builds inline color styles when colors are set', () => {
    assert.deepEqual(chromeInlineStyle({ backgroundColor: '#fff', borderColor: '#111' }), {
      backgroundColor: '#fff',
      border: '1px solid #111',
    })
    assert.deepEqual(chromeInlineStyle({}), {
      backgroundColor: undefined,
      border: undefined,
    })
  })

  it('resolves background and border from the theme palette slot', () => {
    const theme = {
      colorPaletteId: 'pal',
      colorPalettes: [
        {
          id: 'pal',
          name: 'Brand',
          colors: [
            { name: 'Ink', value: '#111111' },
            { name: 'Paper', value: '#EEEEEE' },
          ],
        },
      ],
    } as unknown as WebsiteTheme
    assert.equal(chromeColorSlotId(theme, 'pal', undefined, '#eeeeee'), '2')
    assert.deepEqual(
      chromeInlineStyle(
        { backgroundColor: '#000000', backgroundColorIndex: 2, borderColorIndex: 1 },
        { theme, paletteId: 'pal' },
      ),
      {
        backgroundColor: '#EEEEEE',
        border: '1px solid #111111',
      },
    )
  })

  it('picks only chrome fields', () => {
    assert.deepEqual(
      pickElementChrome({
        backgroundColor: '#abc',
        borderRadius: 'sm',
        padding: 1,
      }),
      {
        backgroundColor: '#abc',
        borderColor: undefined,
        borderRadius: 'sm',
        boxShadow: undefined,
        padding: 1,
        margin: undefined,
      },
    )
  })
})
