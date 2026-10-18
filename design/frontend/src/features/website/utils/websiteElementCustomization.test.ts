import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyVisualStyleToHtml,
  defaultElementHtml,
  defaultElementStyles,
  effectiveElementHtml,
  effectiveElementStyles,
  elementScopeClass,
  finalizeElementCustomization,
  hasElementCustomization,
  isDefaultElementStyles,
  isSkeletonElementHtml,
} from './websiteElementCustomization'

describe('websiteElementCustomization', () => {
  it('uses a button tag as the root with the id class', () => {
    const html = defaultElementHtml('button', 'btn_abc-1')
    assert.match(html, /^<button type="button" class="website-element-root website-el-btn_abc-1 inline-flex items-center justify-center px-4 py-2"/)
    assert.match(html, /data-website-element="button"/)
    assert.match(html, />\{\{label\}\}<\/button>$/)
    assert.doesNotMatch(html, /<div/)
  })

  it('applies basic-settings visuals to the button root as CSS variables', () => {
    const html = defaultElementHtml('button', 'btn1', {
      background: '#111827',
      color: '#ffffff',
      border: '2px solid #0ea5e9',
      borderRadius: 8,
      fontFamily: 'Inter',
      fontSize: 18,
      lineHeight: 1,
    })
    assert.match(
      html,
      /<button type="button" class="website-element-root website-el-btn1 inline-flex items-center justify-center px-4 py-2" data-website-element="button" style="/,
    )
    assert.match(html, /--el-bg: #111827/)
    assert.match(html, /--el-color: #ffffff/)
    assert.match(html, /--el-border: 2px solid #0ea5e9/)
    assert.match(html, /--el-radius: 8px/)
    assert.match(html, /--el-font-family: Inter/)
    assert.match(html, /--el-font-size: 18px/)
    assert.match(html, /--el-line-height: 1/)
    assert.doesNotMatch(html, /<div/)
    assert.doesNotMatch(html, /style="[^"]*background:/)
  })

  it('seeds an empty CSS rule for the button id class', () => {
    assert.equal(elementScopeClass('btn_abc-1'), 'website-el-btn_abc-1')
    assert.equal(defaultElementStyles('btn_abc-1'), '.website-el-btn_abc-1 {\n}\n')
    assert.equal(isDefaultElementStyles('.website-el-btn_abc-1 {\n  \n}', 'btn_abc-1'), true)
    assert.equal(isDefaultElementStyles('.website-el-btn_abc-1 {\n  color: red;\n}', 'btn_abc-1'), false)
  })

  it('treats stored label-only HTML as a skeleton and shows complete default markup', () => {
    const visual = {
      background: '#175E83',
      color: '#ffffff',
      border: '0px solid transparent',
      borderRadius: 6,
      fontFamily: 'Inter',
      fontSize: 18,
      lineHeight: 1,
    }
    const stored = '<span class="website-el-lib-button-primary inline-flex items-center justify-center px-4 py-2">{{label}}</span>'
    assert.equal(isSkeletonElementHtml(stored), true)
    const shown = effectiveElementHtml({ html: stored, styles: '', scripts: '' }, defaultElementHtml('button', 'lib-button-primary', visual), visual)
    assert.match(shown, /^<button type="button" class="website-element-root website-el-lib-button-primary inline-flex/)
    assert.match(shown, /data-website-element="button"/)
    assert.match(shown, /--el-radius: 6px/)
    assert.match(shown, /--el-bg: #175E83/)
    assert.match(shown, /\{\{label\}\}<\/button>/)
    const finalized = finalizeElementCustomization(
      { html: stored, styles: '', scripts: '' },
      defaultElementHtml('button', 'lib-button-primary', visual),
      'lib-button-primary',
    )
    assert.equal(finalized.html, '')
  })

  it('merges basic-settings CSS onto the root and keeps extra Tailwind classes', () => {
    const html = applyVisualStyleToHtml(
      '<button class="website-el-x rounded-none" type="button">{{label}}</button>',
      { background: '#111', borderRadius: 4, color: '#fff' },
    )
    assert.match(html, /class="[^"]*\bwebsite-element-root\b/)
    assert.match(html, /\brounded-none\b/)
    assert.match(html, /style="[^"]*--el-bg: #111/)
    assert.match(html, /--el-radius: 4px/)
    assert.match(html, /type="button"/)
    assert.doesNotMatch(html, /style="[^"]*background:/)
  })

  it('unwraps a wrapping div so the button is the root with basic-setting vars', () => {
    const stored =
      '<div class="website-element-root" data-website-element style="--el-bg: #344CE2; --el-color: #FFFFFF; --el-border: 2px solid transparent; --el-radius: 10px; --el-font-family: Inter; --el-font-size: 18px; --el-line-height: 1"><button class="website-el-lib-button-primary">{{label}}</button></div>'
    const visual = {
      background: '#344CE2',
      color: '#FFFFFF',
      border: '2px solid transparent',
      borderRadius: 10,
      fontFamily: 'Inter',
      fontSize: 18,
      lineHeight: 1,
    }
    const shown = effectiveElementHtml(
      { html: stored, styles: 'button { box-shadow: none; }', scripts: '' },
      defaultElementHtml('button', 'lib-button-primary', visual),
      visual,
    )
    assert.equal(isSkeletonElementHtml(stored), false)
    assert.match(shown, /^<button\b/)
    assert.match(shown, /\btype="button"/)
    assert.match(shown, /\bwebsite-element-root\b/)
    assert.match(shown, /\bwebsite-el-lib-button-primary\b/)
    assert.match(shown, /\binline-flex\b/)
    assert.match(shown, /data-website-element="button"/)
    assert.match(shown, /--el-bg: #344CE2/)
    assert.match(shown, /--el-radius: 10px/)
    assert.match(shown, /\{\{label\}\}<\/button>$/)
    assert.doesNotMatch(shown, /<div/)
  })

  it('seeds the root id class in styles when it is missing', () => {
    const styles = effectiveElementStyles(
      { html: '', styles: 'button { box-shadow: none; }', scripts: '' },
      defaultElementStyles('lib-button-primary'),
      'lib-button-primary',
    )
    assert.match(styles, /^\.website-el-lib-button-primary \{\n\}\n/)
    assert.match(styles, /button \{ box-shadow: none; \}/)
  })

  it('strips default HTML and empty id-class styles on save', () => {
    const scopeId = 'style1'
    const finalized = finalizeElementCustomization(
      {
        html: defaultElementHtml('button', scopeId),
        styles: defaultElementStyles(scopeId),
        scripts: '',
      },
      defaultElementHtml('button', scopeId),
      scopeId,
    )
    assert.equal(finalized.html, '')
    assert.equal(finalized.styles, '')
    assert.equal(hasElementCustomization(finalized), false)
  })
})
