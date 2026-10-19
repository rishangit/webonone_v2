import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyLayoutByBreakpoint, emptyWebsiteDocument, WEBSITE_CANVAS_WIDTH } from '../types'
import { resolveLayoutRect } from './layout'
import type { LayoutRect } from '../types'

function containedWidth(child: LayoutRect, parent: LayoutRect, canvas: number): number {
  const parentPx = parent.colSpan * (canvas / 12)
  return (child.colSpan / 12) * parentPx
}
import { updateAddon, updateBlockById } from './blockTree'
import { applyCanvasOperations, formatDesignerCanvasContext } from './applyCanvas'

describe('applyCanvasOperations placement', () => {
  it('stacks sections and flows buttons into a desktop row that stacks on phone', () => {
    const result = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Hero',
      operations: [
        { op: 'add_block' },
        { op: 'add_addon', type: 'text', text: 'Welcome', role: 'heading' },
        { op: 'add_addon', type: 'button', text: 'Book' },
        { op: 'add_addon', type: 'button', text: 'Call' },
        { op: 'add_block' },
        { op: 'add_addon', type: 'text', text: 'About', role: 'heading' },
      ],
    })

    assert.equal(result.applied, 6)
    assert.equal(result.document.blocks.length, 2)

    const hero = result.document.blocks[0]
    const about = result.document.blocks[1]
    assert.ok(hero)
    assert.ok(about)
    const heroDesktop = resolveLayoutRect(hero.layout, '2xl')
    const aboutDesktop = resolveLayoutRect(about.layout, '2xl')
    assert.equal(aboutDesktop.top, heroDesktop.top + heroDesktop.height)

    const [heading, book, call] = hero.addons
    assert.ok(heading && book && call)
    assert.equal(heading.type, 'text')
    if (heading.type === 'text') {
      assert.equal(heading.props.fontSizeByBreakpoint?.sm, 24)
      assert.equal(heading.props.fontSizeByBreakpoint?.['2xl'], 40)
    }

    const canvas = WEBSITE_CANVAS_WIDTH['2xl']
    const headingDesktop = resolveLayoutRect(heading.layout, '2xl')
    const bookDesktop = resolveLayoutRect(book.layout, '2xl')
    const callDesktop = resolveLayoutRect(call.layout, '2xl')
    assert.ok(containedWidth(headingDesktop, heroDesktop, canvas) >= 200)
    assert.ok(headingDesktop.height >= 96)
    assert.ok(containedWidth(bookDesktop, heroDesktop, canvas) >= 70)
    assert.ok(bookDesktop.height >= 64)
    assert.ok(heroDesktop.height >= headingDesktop.top + headingDesktop.height)
    assert.ok(heroDesktop.height >= bookDesktop.top + bookDesktop.height)
    assert.ok(heroDesktop.height >= callDesktop.top + callDesktop.height)
    assert.ok(callDesktop.col >= bookDesktop.col + bookDesktop.colSpan || callDesktop.top >= bookDesktop.top + bookDesktop.height)
  })
})

describe('applyCanvasOperations names', () => {
  it('stores a tree name on each new block and addon', () => {
    const result = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block', name: 'Footer' },
        { op: 'add_block', group: true, name: 'Contact us' },
        { op: 'add_addon', type: 'text', name: 'Contact heading', text: 'Contact Us', role: 'heading' },
        { op: 'add_addon', type: 'text', text: 'Colombo', role: 'body' },
      ],
    })
    const section = result.document.blocks[0]
    const group = section?.children?.[0]
    assert.equal(section?.name, 'Footer')
    assert.equal(group?.name, 'Contact us')
    assert.equal(group?.addons[0]?.name, 'Contact heading')
    assert.equal(group?.addons[1]?.name, 'Colombo')
  })

  it('renames an existing block and addon without changing their content', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block', name: 'Footer' },
        { op: 'add_addon', type: 'text', name: 'Contact heading', text: 'Contact Us', role: 'heading' },
      ],
    })
    const block = placed.document.blocks[0]
    const heading = block?.addons[0]
    assert.ok(block && heading && heading.type === 'text')

    const result = applyCanvasOperations(placed.document, {
      name: 'Rename contact',
      operations: [
        { op: 'rename', blockId: block.id, name: 'Company' },
        { op: 'rename', addonId: heading.id, name: 'Heading' },
      ],
    })

    const nextBlock = result.document.blocks[0]
    const nextHeading = nextBlock?.addons[0]
    assert.equal(result.applied, 2)
    assert.equal(nextBlock?.id, block.id)
    assert.equal(nextBlock?.name, 'Company')
    assert.ok(nextHeading && nextHeading.type === 'text')
    assert.equal(nextHeading.id, heading.id)
    assert.equal(nextHeading.name, 'Heading')
    assert.equal(nextHeading.props.content, 'Contact Us')
  })

  it('renames from the text field when name is omitted', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block', name: 'Footer' },
        { op: 'add_addon', type: 'text', name: 'Heading', text: 'Contact Us', role: 'heading' },
      ],
    })
    const block = placed.document.blocks[0]
    const heading = block?.addons[0]
    assert.ok(block && heading)

    const result = applyCanvasOperations(placed.document, {
      name: 'Rename elements for content tree',
      operations: [
        { op: 'rename', text: 'Navigation Links', blockId: block.id },
        { op: 'rename', text: 'Quick Links Heading', addonId: heading.id, blockId: block.id },
      ],
    })

    const nextBlock = result.document.blocks[0]
    const nextHeading = nextBlock?.addons[0]
    assert.equal(result.applied, 2)
    assert.equal(nextBlock?.name, 'Navigation Links')
    assert.ok(nextHeading && nextHeading.type === 'text')
    assert.equal(nextHeading.name, 'Quick Links Heading')
    assert.equal(nextHeading.props.content, 'Contact Us')
  })
})

describe('applyCanvasOperations groups', () => {
  it('builds a section from small groups of related elements', () => {
    const result = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Hero',
      operations: [
        { op: 'add_block' },
        { op: 'add_block', group: true, span: 'half' },
        { op: 'add_addon', type: 'text', text: 'Welcome', role: 'heading' },
        { op: 'add_addon', type: 'text', text: 'A short introduction', role: 'body' },
        { op: 'add_block', group: true, span: 'half' },
        { op: 'add_addon', type: 'button', text: 'Book' },
        { op: 'add_addon', type: 'button', text: 'Call' },
      ],
    })

    assert.equal(result.applied, 7)
    assert.equal(result.document.blocks.length, 1)
    const section = result.document.blocks[0]
    assert.ok(section)
    assert.equal(section.addons.length, 0)
    assert.equal(section.children.length, 2)
    assert.equal(section.children[0]?.addons.length, 2)
    assert.equal(section.children[1]?.addons.length, 2)

    const intro = section.children[0]
    const actions = section.children[1]
    assert.ok(intro && actions)
    const canvas = WEBSITE_CANVAS_WIDTH['2xl']
    const introDesktop = resolveLayoutRect(intro.layout, '2xl')
    const actionsDesktop = resolveLayoutRect(actions.layout, '2xl')
    const sectionDesktop = resolveLayoutRect(section.layout, '2xl')
    const welcome = intro.addons.find((addon) => addon.type === 'text' && addon.props.content === 'Welcome')
    assert.ok(welcome)
    const welcomeRect = resolveLayoutRect(welcome.layout, '2xl')
    const introPx = containedWidth(introDesktop, sectionDesktop, canvas)
    const welcomePx = (welcomeRect.colSpan / 12) * introPx
    assert.ok(welcomePx >= 200)
    assert.ok(introDesktop.height >= welcomeRect.top + welcomeRect.height)
    assert.ok(sectionDesktop.height >= introDesktop.top + introDesktop.height)
    assert.ok(sectionDesktop.height >= actionsDesktop.top + actionsDesktop.height)
    assert.ok(containedWidth(introDesktop, sectionDesktop, canvas) >= welcomePx)
  })
})

describe('applyCanvasOperations footer copy', () => {
  it('treats text without a type as a text element', () => {
    const result = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Design footer layout',
      operations: [
        { op: 'add_block' },
        { op: 'add_addon', span: 'third', text: '[Logo] Company Name' },
        { op: 'add_addon', role: 'body', span: 'third', text: 'Email: info@company.com' },
        { op: 'add_addon', span: 'third', text: 'Home\nAbout' },
        { op: 'add_block' },
        { op: 'add_addon', role: 'body', span: 'full', text: '© 2024 Company Name. All rights reserved.' },
      ],
    })

    assert.equal(result.applied, 6)
    const top = result.document.blocks[0]
    const bottom = result.document.blocks[1]
    assert.equal(top?.addons.length, 3)
    assert.equal(bottom?.addons.length, 1)
    assert.ok(top?.addons.every((addon) => addon.type === 'text'))
    const canvas = WEBSITE_CANVAS_WIDTH['2xl']
    const topRect = resolveLayoutRect(top!.layout, '2xl')
    for (const addon of top!.addons) {
      const rect = resolveLayoutRect(addon.layout, '2xl')
      assert.ok(containedWidth(rect, topRect, canvas) >= 40)
      assert.ok(topRect.height >= rect.top + rect.height)
    }
    const copyright = resolveLayoutRect(bottom!.addons[0]!.layout, '2xl')
    const bottomRect = resolveLayoutRect(bottom!.layout, '2xl')
    assert.ok(bottomRect.height >= copyright.top + copyright.height)
    assert.ok(containedWidth(copyright, bottomRect, canvas) >= 180)
  })
})

describe('applyCanvasOperations replace element', () => {
  it('replaces a named element when the section id is omitted', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block' },
        { op: 'add_addon', type: 'text', text: 'Company name' },
        { op: 'add_addon', type: 'text', text: 'Links' },
      ],
    })
    const block = placed.document.blocks[0]
    const logo = block?.addons[0]
    assert.ok(block && logo)

    const result = applyCanvasOperations(placed.document, {
      name: 'Add company logo image',
      operations: [
        { op: 'delete_addon', addonId: logo.id },
        { op: 'add_addon', type: 'image', span: 'half' },
      ],
    })

    assert.equal(result.applied, 2)
    const addons = result.document.blocks[0]?.addons ?? []
    assert.equal(addons.length, 2)
    assert.equal(addons[0]?.type, 'image')
    assert.equal(addons[1]?.type, 'text')
    const image = addons[0]
    const host = resolveLayoutRect(result.document.blocks[0]!.layout, '2xl')
    assert.ok(image)
    const imageRect = resolveLayoutRect(image.layout, '2xl')
    assert.ok(containedWidth(imageRect, host, WEBSITE_CANVAS_WIDTH['2xl']) >= 160)
    assert.equal(imageRect.height, 160)
    assert.ok(host.height >= imageRect.top + imageRect.height)
  })

  it('edits an existing group by block id and moves it to the right', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block' },
        { op: 'add_block', group: true },
        { op: 'add_addon', type: 'text', text: 'Links', role: 'heading' },
        { op: 'add_addon', type: 'text', text: 'Home', role: 'body' },
        { op: 'add_block', group: true },
        { op: 'add_addon', type: 'text', text: 'Contact Us', role: 'heading' },
        { op: 'add_addon', type: 'text', text: 'Colombo', role: 'body' },
      ],
    })
    const section = placed.document.blocks[0]
    const contact = section?.children?.[1]
    assert.ok(section && contact)

    const result = applyCanvasOperations(placed.document, {
      name: 'Align Contact Us to right',
      operations: [{ op: 'update_text', text: 'Contact Us', blockId: contact.id }],
    })

    assert.equal(result.applied, 1)
    const moved = result.document.blocks[0]?.children?.find((block) => block.id === contact.id)
    const parent = resolveLayoutRect(result.document.blocks[0]!.layout, '2xl')
    const contactRect = resolveLayoutRect(moved!.layout, '2xl')
    const links = result.document.blocks[0]?.children?.[0]
    const linksRect = resolveLayoutRect(links!.layout, '2xl')
    assert.equal(moved?.place, 'end')
    assert.equal(parent.colSpan, 12)
    assert.equal(contactRect.col + contactRect.colSpan - 1, 12)
    assert.equal(linksRect.col, 1)
    const heading = moved?.addons.find((addon) => addon.type === 'text')
    assert.ok(heading && heading.type === 'text')
    assert.ok(containedWidth(resolveLayoutRect(heading.layout, '2xl'), contactRect, WEBSITE_CANVAS_WIDTH['2xl']) >= 40)
  })

  it('keeps manual text and position when another element is edited', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block' },
        { op: 'add_addon', type: 'text', text: 'Links', role: 'heading' },
        { op: 'add_addon', type: 'text', text: 'Home', role: 'body' },
      ],
    })
    const block = placed.document.blocks[0]
    const heading = block?.addons[0]
    const body = block?.addons[1]
    assert.ok(block && heading && body && heading.type === 'text')
    const manualLayout = { col: 2, colSpan: 4, top: 64, height: 96 }
    const manual = updateAddon(placed.document, block.id, {
      ...heading,
      props: { ...heading.props, content: 'Our links' },
      layout: { ...heading.layout, '2xl': manualLayout },
    })

    const result = applyCanvasOperations(manual, {
      name: 'Change home',
      operations: [{ op: 'update_text', text: 'About', blockId: block.id, addonId: body.id }],
    })

    const nextHeading = result.document.blocks[0]?.addons.find((addon) => addon.id === heading.id)
    const nextBody = result.document.blocks[0]?.addons.find((addon) => addon.id === body.id)
    assert.ok(nextHeading && nextHeading.type === 'text')
    assert.equal(nextHeading.props.content, 'Our links')
    assert.deepEqual(resolveLayoutRect(nextHeading.layout, '2xl'), manualLayout)
    assert.ok(nextBody && nextBody.type === 'text')
    assert.equal(nextBody.props.content, 'About')
  })
})

describe('applyCanvasOperations grid', () => {
  it('moves a block onto the grid and shifts the block it would cover', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Two sections',
      operations: [{ op: 'add_block', name: 'Intro' }, { op: 'add_block', name: 'Contact' }, { op: 'add_block', name: 'Hours' }],
    })
    const [intro, contact, hours] = placed.document.blocks
    assert.ok(intro && contact && hours)
    let document = updateBlockById(placed.document, intro.id, (block) => ({
      ...block,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 6, top: 0, height: 96 }),
    }))
    document = updateBlockById(document, contact.id, (block) => ({
      ...block,
      layout: emptyLayoutByBreakpoint({ col: 7, colSpan: 6, top: 0, height: 96 }),
    }))
    document = updateBlockById(document, hours.id, (block) => ({
      ...block,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 4, top: 320, height: 96 }),
    }))

    const result = applyCanvasOperations(document, {
      name: 'Move intro onto contact',
      operations: [{ op: 'move', blockId: intro.id, col: 7, row: 0, cols: 6, rows: 3 }],
    })

    const moved = result.document.blocks.find((block) => block.id === intro.id)
    const shifted = result.document.blocks.find((block) => block.id === contact.id)
    const stayed = result.document.blocks.find((block) => block.id === hours.id)
    assert.ok(moved && shifted && stayed)
    const movedRect = resolveLayoutRect(moved.layout, '2xl')
    const shiftedRect = resolveLayoutRect(shifted.layout, '2xl')
    const stayedRect = resolveLayoutRect(stayed.layout, '2xl')
    assert.equal(movedRect.col, 7)
    assert.equal(movedRect.colSpan, 6)
    assert.equal(movedRect.top, 0)
    assert.equal(movedRect.height, 96)
    assert.equal(shiftedRect.col, 1)
    assert.equal(shiftedRect.top, 0)
    assert.equal(stayedRect.col, 1)
    assert.equal(stayedRect.top, 320)
    assert.equal(resolveLayoutRect(moved.layout, 'sm').col, 7)
  })

  it('aligns two columns on a full-width row when the operation name is omitted', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Footer',
      operations: [
        { op: 'add_block', name: 'Navigation' },
        { op: 'add_block', group: true, name: 'Quick links' },
        { op: 'add_block', group: true, name: 'Resources' },
      ],
    })
    const section = placed.document.blocks[0]
    const quick = section?.children?.[0]
    const resources = section?.children?.[1]
    assert.ok(section && quick && resources)
    let document = updateBlockById(placed.document, section.id, (block) => ({
      ...block,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 8, top: 0, height: 320 }),
    }))
    document = updateBlockById(document, quick.id, (block) => ({
      ...block,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 6, top: 0, height: 160 }),
    }))
    document = updateBlockById(document, resources.id, (block) => ({
      ...block,
      layout: emptyLayoutByBreakpoint({ col: 7, colSpan: 6, top: 160, height: 160 }),
    }))

    const result = applyCanvasOperations(document, {
      name: 'Align navigation columns horizontally',
      operations: [
        { col: 1, row: 0, cols: 6, blockId: quick.id },
        { col: 7, row: 0, cols: 6, blockId: resources.id },
      ],
    })

    const parent = resolveLayoutRect(result.document.blocks[0]!.layout, '2xl')
    const left = resolveLayoutRect(result.document.blocks[0]!.children![0]!.layout, '2xl')
    const right = resolveLayoutRect(result.document.blocks[0]!.children![1]!.layout, '2xl')
    assert.equal(result.applied, 2)
    assert.equal(parent.col, 1)
    assert.equal(parent.colSpan, 12)
    assert.equal(left.col, 1)
    assert.equal(left.colSpan, 6)
    assert.equal(left.top, 0)
    assert.equal(right.col, 7)
    assert.equal(right.colSpan, 6)
    assert.equal(right.top, 0)
  })

  it('resizes an add-on and leaves a clear neighbour in place', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      name: 'Pair',
      operations: [
        { op: 'add_block', name: 'Intro' },
        { op: 'add_addon', type: 'text', name: 'Heading', text: 'Welcome', role: 'heading' },
        { op: 'add_addon', type: 'button', name: 'Book', text: 'Book' },
      ],
    })
    const block = placed.document.blocks[0]
    const heading = block?.addons[0]
    const book = block?.addons[1]
    assert.ok(block && heading && book)
    let document = updateAddon(placed.document, block.id, {
      ...heading,
      layout: emptyLayoutByBreakpoint({ col: 1, colSpan: 4, top: 0, height: 64 }),
    })
    document = updateAddon(document, block.id, {
      ...book,
      layout: emptyLayoutByBreakpoint({ col: 8, colSpan: 3, top: 0, height: 64 }),
    })

    const result = applyCanvasOperations(document, {
      name: 'Widen heading',
      operations: [{ op: 'move', addonId: heading.id, cols: 6, rows: 2 }],
    })

    const nextHeading = result.document.blocks[0]?.addons.find((addon) => addon.id === heading.id)
    const nextBook = result.document.blocks[0]?.addons.find((addon) => addon.id === book.id)
    assert.ok(nextHeading && nextBook)
    const headingRect = resolveLayoutRect(nextHeading.layout, '2xl')
    const bookRect = resolveLayoutRect(nextBook.layout, '2xl')
    assert.equal(headingRect.colSpan, 6)
    assert.equal(headingRect.height, 64)
    assert.equal(bookRect.col, 8)
    assert.equal(bookRect.top, 0)
    assert.ok(result.document.blocks[0]!.layout['2xl'].height >= headingRect.top + headingRect.height)
  })
})

describe('formatDesignerCanvasContext', () => {
  it('names the copied element so later edits use that id', () => {
    const placed = applyCanvasOperations(emptyWebsiteDocument(), {
      operations: [
        { op: 'add_block' },
        { op: 'add_addon', type: 'button', text: 'Book' },
      ],
    })
    const block = placed.document.blocks[0]
    const button = block?.addons[0]
    assert.ok(block && button)
    const context = formatDesignerCanvasContext({
      kind: 'pages',
      id: 'page-1',
      name: 'Home',
      document: placed.document,
      focus: { kind: 'addon', blockId: block.id, addonId: button.id },
    })
    assert.match(context, new RegExp(`addon ${button.id} in block ${block.id}`))
    assert.match(context, /The user copied this element/)
  })
})