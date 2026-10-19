import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyDesignCanvasSchema } from './websiteCanvas.schema.ts'

describe('applyDesignCanvasSchema', () => {
  it('fills text type when a footer suggestion sends copy without type', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Design footer layout',
      operations: [
        { op: 'add_block' },
        { op: 'add_addon', span: 'third', text: '[Logo] Company Name' },
        { op: 'add_addon', items: ['Home', 'About'] },
      ],
    })
    assert.equal(parsed.operations[1]?.type, 'text')
    assert.equal(parsed.operations[2]?.type, 'menu')
  })

  it('accepts a small group nested in a section', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Hero groups',
      operations: [
        { op: 'add_block' },
        { op: 'add_block', group: true, span: 'half' },
        { op: 'add_addon', type: 'text', text: 'Welcome', role: 'heading' },
        { op: 'add_addon', type: 'text', text: 'Intro', role: 'body' },
      ],
    })
    assert.equal(parsed.operations[1]?.group, true)
    assert.equal(parsed.operations[1]?.span, 'half')
  })

  it('accepts an element change that names only the addon id', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Add company logo image',
      operations: [
        { op: 'delete_addon', addonId: 'bD4wjoe3Gn' },
        { op: 'add_addon', span: 'half', type: 'image' },
      ],
    })
    assert.equal(parsed.operations.length, 2)
  })

  it('accepts an edit that names the existing block and not the addon', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Align Contact Us to right',
      operations: [{ op: 'update_text', text: 'Contact Us', blockId: 'OE6Cd4m2Ct' }],
    })
    assert.equal(parsed.operations[0]?.op, 'update_text')
    assert.equal(parsed.operations[0]?.blockId, 'OE6Cd4m2Ct')
  })

  it('keeps a content-tree name on a new block and add-on', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Create footer',
      operations: [
        { op: 'add_block', name: 'Footer' },
        { op: 'add_addon', type: 'text', name: 'Contact us', text: 'Contact Us', role: 'heading' },
      ],
    })
    const section = parsed.operations[0]
    const heading = parsed.operations[1]
    assert.equal(section && 'name' in section ? section.name : undefined, 'Footer')
    assert.equal(heading && 'name' in heading ? heading.name : undefined, 'Contact us')
  })

  it('accepts a rename that sends the new tree name in text', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Rename elements for content tree',
      operations: [
        { op: 'rename', text: 'Navigation Links', blockId: 'uZkyFLSZkZ' },
        { op: 'rename', text: 'Quick Links Heading', addonId: 'ei78cqCcV_', blockId: 'ierxrOvLs8' },
      ],
    })
    assert.equal(parsed.operations[0] && 'name' in parsed.operations[0] ? parsed.operations[0].name : undefined, 'Navigation Links')
    assert.equal(parsed.operations[1] && 'name' in parsed.operations[1] ? parsed.operations[1].name : undefined, 'Quick Links Heading')
  })

  it('accepts renaming an existing block or addon', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Rename contact',
      operations: [
        { op: 'rename', blockId: 'OE6Cd4m2Ct', name: 'Company' },
        { op: 'rename', addonId: 'bD4wjoe3Gn', name: 'Heading' },
      ],
    })
    assert.equal(parsed.operations[0]?.op, 'rename')
    assert.equal(parsed.operations[0] && 'name' in parsed.operations[0] ? parsed.operations[0].name : undefined, 'Company')
    assert.equal(parsed.operations[1] && 'addonId' in parsed.operations[1] ? parsed.operations[1].addonId : undefined, 'bD4wjoe3Gn')
  })

  it('treats a grid position without an operation name as a move', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Align navigation columns horizontally',
      operations: [
        { col: 1, row: 0, cols: 6, blockId: 'ierxrOvLs8' },
        { col: 7, row: 0, cols: 6, blockId: 'zQ6v3nW-Pa' },
      ],
    })
    assert.equal(parsed.operations[0]?.op, 'move')
    assert.equal(parsed.operations[1]?.op, 'move')
    assert.equal(parsed.operations[0] && 'col' in parsed.operations[0] ? parsed.operations[0].col : undefined, 1)
    assert.equal(parsed.operations[1] && 'col' in parsed.operations[1] ? parsed.operations[1].col : undefined, 7)
  })

  it('accepts a grid move and resize', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Place contact on the grid',
      operations: [
        { op: 'move', blockId: 'OE6Cd4m2Ct', col: '7', row: 1, cols: 4, rows: '3' },
        { op: 'move', addonId: 'bD4wjoe3Gn', cols: 6 },
      ],
    })
    const blockMove = parsed.operations[0]
    const addonMove = parsed.operations[1]
    assert.equal(blockMove && 'col' in blockMove ? blockMove.col : undefined, 7)
    assert.equal(blockMove && 'row' in blockMove ? blockMove.row : undefined, 1)
    assert.equal(blockMove && 'rows' in blockMove ? blockMove.rows : undefined, 3)
    assert.equal(addonMove && 'cols' in addonMove ? addonMove.cols : undefined, 6)
  })

  it('accepts moving an existing block', () => {
    const parsed = applyDesignCanvasSchema.parse({
      name: 'Move contact',
      operations: [{ op: 'place_block', blockId: 'OE6Cd4m2Ct', align: 'end' }],
    })
    assert.equal(parsed.operations[0]?.align, 'end')
  })
})
