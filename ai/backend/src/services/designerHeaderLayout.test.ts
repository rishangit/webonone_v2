import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { headerRowCanvasArguments, heroImageCanvasArguments } from './designerHeaderLayout.js'

const REQUEST = `[designer-canvas]
kind: headers
id: header1
name: Main header
blocks:
(empty canvas)
[/designer-canvas]

i need to desing the website header, withing the header block need to have the two block eual width aling in row, left block need to have the company logo and the company name, right block need to have the page menu`

describe('headerRowCanvasArguments', () => {
  it('builds an equal header row from the designer request', () => {
    const args = headerRowCanvasArguments(REQUEST)
    assert.ok(args)
    assert.equal(args.name, 'Design Website Header')
    assert.equal(args.operations[2]?.['type'], 'image')
    assert.equal(args.operations[3]?.['type'], 'text')
    assert.equal(args.operations[5]?.['type'], 'menu')
    assert.equal(args.operations[1]?.['align'], 'start')
    assert.equal(args.operations[4]?.['align'], 'end')
  })

  it('builds a full-width hero image for a page edit', () => {
    const args = heroImageCanvasArguments(`[designer-canvas]
kind: pages
id: page1
name: Home
blocks:
(empty canvas)
[/designer-canvas]

need to add the home page full width large image`)
    assert.ok(args)
    assert.equal(args.operations[1]?.['type'], 'image')
    assert.equal(args.operations[1]?.['span'], 'full')
  })

  it('uses the same header row on a footer or preset canvas', () => {
    assert.ok(headerRowCanvasArguments(REQUEST.replace('kind: headers', 'kind: footers')))
    assert.ok(headerRowCanvasArguments(REQUEST.replace('kind: headers', 'kind: presets')))
  })

  it('leaves a multi-section homepage to the task planner', () => {
    const args = heroImageCanvasArguments(`[designer-canvas]
kind: pages
id: page1
name: Home
blocks:
(empty canvas)
[/designer-canvas]

# Design a homepage

## 1. Hero Section
Full-width hero image, headline, and a call to action.

## 2. About the Company
Introduction and three strengths.

## 3. Full-Width Image Banner
Headline over a banner image.

## 4. Company Details
Image on the left and text on the right.

## 5. General Design Requirements
Use the existing theme.

## Expected Result
Four sections in that order.`)
    assert.equal(args, null)
  })

  it('ignores a designer canvas when the request is not a header or hero', () => {
    const note = REQUEST.replace(/i need to desing[\s\S]*$/, 'Change the phone number')
    assert.equal(headerRowCanvasArguments(note), null)
    assert.equal(heroImageCanvasArguments(note), null)
  })
})
