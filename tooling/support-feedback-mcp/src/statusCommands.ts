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

/**
 * Single-line prompts only — multi-line breaks Windows cmd when spawning agent.
 * CLI cannot confirm Plan mode: write plan.md in Agent mode without SwitchMode or user prompts.
 */
export const STATUS_COMMANDS: Partial<Record<FeedbackStatus, StatusCommand>> = {
  ready_to_develop: {
    name: 'feedback-fix',
    buildPrompt: (payload) => {
      const ticket = payload.ticketNumber
      const bits = [
        `/feedback-fix ${ticket}.`,
        'Follow .cursor/commands/feedback-fix.md and .cursor/skills/feedback-fix/SKILL.md.',
        'Fully non-interactive: do not SwitchMode to plan, do not ask for confirmation.',
        `Write spec/${ticket}/spec.md and spec/${ticket}/plan.md before feedback_update_status planned.`,
        `Implement, verify type-check/lint, set developed, write spec/${ticket}/development-summary.md (where to see feature, paths, commit message).`,
        'Make exactly one git commit for the ticket (no follow-up commit to record the deploy sha), push origin deploy_staging, then feedback_update_status staging.',
        'Use Support Feedback MCP for feedback_get, feedback_list, feedback_update_status.',
      ]
      if (payload.title) bits.push(`Title: ${payload.title.replace(/\s+/g, ' ').slice(0, 120)}`)
      if (payload.type) bits.push(`Type: ${payload.type}`)
      return bits.join(' ')
    },
  },
}

export function commandForStatus(status: FeedbackStatus): StatusCommand | undefined {
  return STATUS_COMMANDS[status]
}
