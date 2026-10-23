import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CHAT_MESSAGE_MAX_CHARS, sendMessageSchema } from './conversationSchemas.js'

describe('sendMessageSchema design context', () => {
  it('accepts seeded button library ids that are not 21 characters', () => {
    const parsed = sendMessageSchema.parse({
      content: '[Design button: Primary] need to have the black bottom border',
      context: [
        {
          service: 'design',
          kind: 'button',
          id: 'lib-button-primary',
          label: 'Primary',
        },
      ],
    })
    assert.equal(parsed.context?.[0]?.id, 'lib-button-primary')
  })

  it('accepts seeded text library ids', () => {
    const parsed = sendMessageSchema.parse({
      content: '[Design text: Heading] make this larger',
      context: [
        {
          service: 'design',
          kind: 'text',
          id: 'lib-text-heading',
          label: 'Heading',
        },
      ],
    })
    assert.equal(parsed.context?.[0]?.id, 'lib-text-heading')
  })

  it('accepts a prompt longer than 8000 characters', () => {
    const content = 'a'.repeat(8001)
    const parsed = sendMessageSchema.parse({ content })
    assert.equal(parsed.content.length, 8001)
  })

  it('rejects a prompt over the message cap', () => {
    const result = sendMessageSchema.safeParse({ content: 'a'.repeat(CHAT_MESSAGE_MAX_CHARS + 1) })
    assert.equal(result.success, false)
  })

  it('rejects design ids that are too short', () => {
    const result = sendMessageSchema.safeParse({
      content: 'restyle this button',
      context: [{ service: 'design', kind: 'button', id: 'short', label: 'Primary' }],
    })
    assert.equal(result.success, false)
  })
})
