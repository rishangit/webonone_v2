import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { headerRowCanvasArguments, heroImageCanvasArguments } from './designerHeaderLayout.js'
import {
  advanceDesignerTaskRecords,
  parseDesignerTaskPlan,
  splitCanvasArguments,
  stageDesignerTasks,
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
