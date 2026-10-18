import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ensureElementRootStyles,
  normalizeLibraryElementHtml,
  normalizeStoredCustomization,
} from './websiteElementRoot.js'

describe('websiteElementRoot', () => {
  it('unwraps a wrapping div so the button is the root', () => {
    const stored =
      '<div class="website-element-root" data-website-element style="--el-bg: #344CE2; --el-color: #FFFFFF; --el-border: 2px solid transparent; --el-radius: 10px; --el-font-family: Inter; --el-font-size: 18px; --el-line-height: 1"><button class="website-el-lib-button-primary">{{label}}</button></div>'
    const html = normalizeLibraryElementHtml(stored, 'button', 'lib-button-primary')
    assert.match(html, /^<button\b/)
    assert.match(html, /\btype="button"/)
    assert.match(html, /\bwebsite-element-root\b/)
    assert.match(html, /\bwebsite-el-lib-button-primary\b/)
    assert.match(html, /\binline-flex\b/)
    assert.match(html, /data-website-element="button"/)
    assert.match(html, /--el-bg: #344CE2/)
    assert.match(html, /\{\{label\}\}<\/button>$/)
    assert.doesNotMatch(html, /<div/)
    assert.doesNotMatch(html, /data-website-element[^=]/)
  })

  it('seeds .website-el-{id} when styles omit it', () => {
    const styles = ensureElementRootStyles('button { box-shadow: none; }', 'lib-button-primary')
    assert.match(styles, /\.website-el-lib-button-primary \{\n\}/)
    assert.match(styles, /button \{ box-shadow: none; \}/)
  })

  it('normalizes stored customization html and styles together', () => {
    const next = normalizeStoredCustomization(
      {
        html: '<div class="website-element-root"><button class="website-el-x">{{label}}</button></div>',
        styles: '',
        scripts: '',
      },
      'button',
      'lib-button-primary',
    )
    assert.ok(next)
    assert.match(next.html, /^<button\b/)
    assert.match(next.html, /\btype="button"/)
    assert.match(next.styles, /^\.website-el-lib-button-primary \{\n\}\n$/)
  })
})
