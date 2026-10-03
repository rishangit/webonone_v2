import type { FeedbackStatus } from './supportApi.js'

export type StatusCommandPayload = {
  ticketNumber: string
  status: FeedbackStatus
  fromStatus?: FeedbackStatus
  id?: string
  type?: string
  title?: string
}

export type StatusCommand = {
  name: string
  buildPrompt: (payload: StatusCommandPayload) => string
}

/** Map a Support status to a Cursor CLI prompt. Add rows for future statuses. */
export const STATUS_COMMANDS: Partial<Record<FeedbackStatus, StatusCommand>> = {
  ready_to_develop: {
    name: 'feedback-fix',
    buildPrompt: (payload) =>
      [
        `/feedback-fix ${payload.ticketNumber}`,
        '',
        'Follow `.cursor/commands/feedback-fix.md` and `.cursor/skills/feedback-fix/SKILL.md`.',
        'Run end-to-end without asking for confirmation unless blocked.',
        'Use Support Feedback MCP for list/get/update status.',
        payload.title ? `Ticket title: ${payload.title}` : '',
        payload.type ? `Type: ${payload.type}` : '',
        payload.fromStatus ? `Previous status: ${payload.fromStatus}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
  },
}

export function commandForStatus(status: FeedbackStatus): StatusCommand | undefined {
  return STATUS_COMMANDS[status]
}
