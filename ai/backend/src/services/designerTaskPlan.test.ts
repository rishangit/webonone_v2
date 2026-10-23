import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { headerRowCanvasArguments, heroImageCanvasArguments } from './designerHeaderLayout.js'
import {
  advanceDesignerTaskRecords,
  canvasSectionBriefs,
  designerTaskIntro,
  expandPlannerDrafts,
  parseDesignerTaskPlan,
  splitCanvasArguments,
  stageDesignerTasks,
  uncoveredCanvasSections,
} from './designerTaskPlan.js'

const HEADER = `[designer-canvas]
kind: headers
id: header1
name: Main header
blocks:
(empty canvas)
[/designer-canvas]

i need to desing the website header, withing the header block need to have the two block eual width aling in row, left block need to have the company logo and the company name, right block need to have the page menu`

describe('splitCanvasArguments', () => {
  it('splits a header layout into one task per column', () => {
    const args = headerRowCanvasArguments(HEADER)
    assert.ok(args)
    const tasks = splitCanvasArguments(args)
    assert.equal(tasks.length, 3)
    assert.equal(tasks[0]?.title, 'Add Header')
    assert.match(tasks[1]?.title ?? '', /Company/)
    assert.match(tasks[2]?.title ?? '', /Page menu/)
    assert.equal(tasks[0]?.arguments.name, 'Design Website Header')
    assert.equal(tasks[2]?.arguments.operations.at(-1)?.['type'], 'menu')
  })

  it('keeps a single hero image as one task', () => {
    const args = heroImageCanvasArguments(`[designer-canvas]
kind: pages
id: page1
name: Home
blocks:
(empty canvas)
[/designer-canvas]

need to add the home page full width large image`)
    assert.ok(args)
    const tasks = splitCanvasArguments(args)
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0]?.title, 'Add hero image section')
  })
})

const HOMEPAGE = `[designer-canvas]
kind: pages
id: page1
name: Home
blocks:
(empty canvas)
[/designer-canvas]

# Design a homepage

## 1. Hero Section — Top of the Homepage
Full-width hero image, headline, and a primary call to action.

## 2. About the Company — Introduction Section
A short introduction and three strengths.

## 3. Full-Width Image Banner with Text
A banner image with a headline and supporting text.

## 4. Company Details — Image Left, Text Right
Image on the left and text on the right.

## 5. General Design Requirements
Use the existing theme and keep the page responsive.

## 6. Implementation Requirements
Use the existing canvas tools. Do not modify unrelated pages.

## Expected Result
Four sections in that order.`

describe('canvasSectionBriefs', () => {
  it('lists each homepage section and skips design rules', () => {
    const sections = canvasSectionBriefs(HOMEPAGE)
    assert.deepEqual(
      sections.map((section) => section.title),
      [
        'Hero Section — Top of the Homepage',
        'About the Company — Introduction Section',
        'Full-Width Image Banner with Text',
        'Company Details — Image Left, Text Right',
      ],
    )
  })

  it('treats a hero-only plan as missing the later sections', () => {
    const sections = canvasSectionBriefs(HOMEPAGE)
    const missing = uncoveredCanvasSections([{ title: 'Add Hero image section' }], sections)
    assert.equal(missing.length, 3)
    assert.match(missing[0]?.title ?? '', /About/)
  })

  it('keeps a planned section whole instead of splitting its columns', () => {
    const sections = canvasSectionBriefs(HOMEPAGE)
    const drafts = expandPlannerDrafts(
      [
        {
          title: 'Hero Section — Top of the Homepage',
          arguments: {
            name: 'Hero',
            operations: [
              { op: 'add_block', name: 'Hero' },
              { op: 'add_addon', type: 'image', name: 'Hero image' },
            ],
          },
        },
        {
          title: 'About the Company — Introduction Section',
          arguments: {
            name: 'About',
            operations: [
              { op: 'add_block', name: 'About' },
              { op: 'add_block', group: true, name: 'Strength' },
              { op: 'add_addon', type: 'text', name: 'Experience' },
              { op: 'add_addon', type: 'text', name: 'Years in the field' },
            ],
          },
        },
      ],
      sections,
    )
    assert.equal(drafts.length, 2)
    assert.equal(drafts[1]?.arguments.operations.length, 4)
  })
})

describe('designerTaskIntro', () => {
  it('tells the user the next task is prepared after the current one', () => {
    const text = designerTaskIntro([
      { status: 'pending_confirmation' },
      { status: 'queued' },
    ])
    assert.match(text, /implementation list/)
    assert.match(text, /prepared automatically/)
  })
})

describe('parseDesignerTaskPlan', () => {
  it('reads a JSON task list from the planner reply', () => {
    const drafts = parseDesignerTaskPlan(`Here is the plan:
{"tasks":[
  {"title":"Add a heading","arguments":{"name":"Add a heading","operations":[{"op":"add_block","name":"Intro"},{"op":"add_addon","type":"text","name":"Welcome"}]}},
  {"title":"Add a button","arguments":{"name":"Add a button","operations":[{"op":"add_block","name":"Action"},{"op":"add_addon","type":"button","name":"Contact"}]}}
]}`)
    assert.ok(drafts)
    assert.equal(drafts.length, 2)
    assert.equal(drafts[1]?.title, 'Add a button')
  })

  it('returns null when the reply is not a task list', () => {
    assert.equal(parseDesignerTaskPlan('I can add a heading.'), null)
  })
})

describe('advanceDesignerTaskRecords', () => {
  it('releases the next task only after the current one is finished', () => {
    const tasks = stageDesignerTasks(
      'apply_design_canvas',
      [
        { title: 'One', arguments: { name: 'One', operations: [{ op: 'add_block' }] } },
        { title: 'Two', arguments: { name: 'Two', operations: [{ op: 'add_block' }] } },
      ],
      ['a', 'b'],
    )
    assert.ok(tasks)
    assert.equal(tasks[1]?.status, 'queued')
    const next = advanceDesignerTaskRecords(tasks, 'a', 'confirmed')
    assert.equal(next.next?.id, 'b')
    assert.equal(next.next?.status, 'pending_confirmation')
    assert.equal(next.tasks[0]?.status, 'confirmed')
    const done = advanceDesignerTaskRecords(next.tasks, 'b', 'rejected')
    assert.equal(done.next, null)
    assert.equal(done.tasks[1]?.status, 'rejected')
  })
})
