import type { AiProvider } from '../ai/providers/types.js'
import type { AiRequestContext } from '../ai/requestContext.js'
import { HttpError } from './httpError.js'
import type { PolishTextBody } from '../schemas/textPolish.schema.js'

export const TEXT_POLISH_SYSTEM_PROMPT =
  'You improve a single form field. Fix spelling, grammar, and clarity. Keep the same language and meaning. Return only the rewritten field text with no quotes, labels, markdown, or commentary. Use other form fields only as context. Never return or change any other field.'

export function stripPolishedText(raw: string): string {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z0-9_-]*\s*/, '').replace(/\s*```$/, '').trim()
  }
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim()
  }
  return text
}

function buildUserMessage(body: PolishTextBody): string {
  const lines: string[] = []
  const fieldLabel = body.field?.label?.trim()
  const fieldName = body.field?.name?.trim()
  if (fieldLabel || fieldName) {
    lines.push(`Field: ${[fieldLabel, fieldName ? `(${fieldName})` : ''].filter(Boolean).join(' ')}`)
  }
  if (body.field?.control) {
    lines.push(`Control: ${body.field.control}`)
  }
  const formFields = body.form?.fields?.filter((item) => item.value.trim().length > 0) ?? []
  if (formFields.length > 0) {
    lines.push('Form context (hints only; do not rewrite these):')
    for (const item of formFields) {
      const name = item.name ? ` (${item.name})` : ''
      lines.push(`- ${item.label}${name}: ${item.value}`)
    }
  }
  lines.push('Rewrite this field value:')
  lines.push(body.text)
  return lines.join('\n')
}

export type TextPolishService = {
  polish(ctx: AiRequestContext, body: PolishTextBody): Promise<{ text: string }>
}

export function createTextPolishService(deps: {
  resolveProvider: (ctx: AiRequestContext) => Promise<{ provider: AiProvider; systemPrompt: string }>
}): TextPolishService {
  return {
    async polish(ctx, body) {
      const { provider } = await deps.resolveProvider(ctx)
      const completion = await provider.complete({
        systemPrompt: TEXT_POLISH_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(body) }],
      })
      if (completion.toolCalls?.length) {
        throw new HttpError(502, 'AI provider returned an unexpected tool call', 'PROVIDER_ERROR')
      }
      const text = stripPolishedText(completion.content ?? '')
      if (!text) {
        return { text: body.text }
      }
      return { text }
    },
  }
}
