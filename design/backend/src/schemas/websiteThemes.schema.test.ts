import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { updateButtonLibraryElementSchema } from './websiteThemes.schema.ts'

describe('updateButtonLibraryElementSchema', () => {
  it('accepts html and styles for a bottom border without a full definition', () => {
    const parsed = updateButtonLibraryElementSchema.parse({
      html: '<button type="button" class="website-element-root" data-website-element="button">{{label}}</button>',
      styles: '.website-el-lib-button-primary { border-bottom: 2px solid #000000; }',
      scripts: '',
      definition: { borderColorValue: '#000000', borderWidth: '2' },
    })
    assert.equal(parsed.definition?.borderWidth, 2)
    assert.match(parsed.styles ?? '', /border-bottom/)
  })

  it('joins style arrays from tool arguments', () => {
    const parsed = updateButtonLibraryElementSchema.parse({
      styles: ['.website-el-lib-button-primary { border-bottom: 2px solid #000; }'],
    })
    assert.match(parsed.styles ?? '', /border-bottom/)
  })
})
