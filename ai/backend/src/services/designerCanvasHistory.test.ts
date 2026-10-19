import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { keepLatestDesignerCanvas } from './designerCanvasHistory.js'

describe('keepLatestDesignerCanvas', () => {
  it('drops earlier canvas outlines and keeps the latest one', () => {
    const rows = keepLatestDesignerCanvas([
      {
        role: 'user',
        content: '[designer-canvas]\nblocks:\n- block old\n[/designer-canvas]\n\nAdd a footer',
      },
      { role: 'assistant', content: 'Added.' },
      {
        role: 'user',
        content: '[designer-canvas]\nblocks:\n- block current\n  - text edited by hand\n[/designer-canvas]\n\nChange the heading',
      },
    ])
    assert.match(rows[0]!.content, /outdated/)
    assert.doesNotMatch(rows[0]!.content, /block old/)
    assert.match(rows[0]!.content, /Add a footer/)
    assert.match(rows[2]!.content, /block current/)
    assert.match(rows[2]!.content, /edited by hand/)
  })
})
