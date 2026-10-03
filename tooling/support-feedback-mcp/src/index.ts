#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { SupportFeedbackApi } from './supportApi.js'

const feedbackTypeArg = z.enum(['bug', 'feature']).optional()
const feedbackStatusArg = z.enum([
  'todo',
  'ready_to_develop',
  'planned',
  'in_progress',
  'developed',
  'staging',
  'closed',
])

const feedbackTicketArg = z
  .string()
  .regex(/^\d{4}$/, 'Four-digit ticket number (e.g. 0001)')

const server = new McpServer({
  name: 'support-feedback',
  version: '1.0.0',
})

let api: SupportFeedbackApi

try {
  api = SupportFeedbackApi.fromEnv()
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

server.tool(
  'feedback_list',
  'List bug and feature reports from the Support feedback API (paginated).',
  {
    page: z.number().int().min(1).optional().describe('Page number (default 1)'),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Page size (default 12, max 100)'),
    type: feedbackTypeArg.describe('Filter by bug or feature'),
    status: feedbackStatusArg.describe('Filter by workflow status'),
    ticket: feedbackTicketArg.optional().describe('Filter by ticket number (e.g. 0001)'),
    q: z.string().optional().describe('Search title and description'),
  },
  async (args) => {
    const result = await api.listFeedback(args)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  },
)

server.tool(
  'feedback_get',
  'Get a single feedback report by id or four-digit ticket number.',
  {
    id: z
      .string()
      .min(1)
      .describe('Feedback report id (21-char nanoid) or ticket number (0001–9999)'),
  },
  async ({ id }) => {
    const report = /^\d{4}$/.test(id) ? await api.getFeedbackByTicket(id) : await api.getFeedback(id)
    return {
      content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
    }
  },
)

server.tool(
  'feedback_update_status',
  'Update feedback report status (requires super_admin JWT).',
  {
    id: z.string().min(1).describe('Feedback report id'),
    status: feedbackStatusArg.describe('New status'),
  },
  async ({ id, status }) => {
    const report = await api.updateStatus(id, status)
    return {
      content: [{ type: 'text', text: JSON.stringify(report, null, 2) }],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
