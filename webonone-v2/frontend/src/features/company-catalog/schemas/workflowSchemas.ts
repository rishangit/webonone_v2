import { z } from 'zod'

export const WORKFLOW_WIZARD_BASE_STEPS = 4
export const WORKFLOW_WIZARD_QUEUE_STEPS = 5

export type WorkflowWizardStep = 1 | 2 | 3 | 4 | 5

export const WORKFLOW_STEP_TITLES_DURATION = ['Space', 'Staff', 'Forms', 'Summary'] as const
export const WORKFLOW_STEP_TITLES_WINDOW = ['Space', 'Staff', 'Forms', 'Queue', 'Summary'] as const

export type WorkflowSpaceValue = {
  id: string
  name: string
  description?: string | null
}

export type WorkflowStaffValue = {
  id: string
  displayName: string
}

export type WorkflowFormValue = {
  id: string
  name: string
}

export type WorkflowWizardValues = {
  space: WorkflowSpaceValue | null
  staff: WorkflowStaffValue[]
  forms: WorkflowFormValue[]
  sessionQueue: boolean
  addItemsEnabled: boolean
  addItemsFromLibraryEnabled: boolean
}

export const EMPTY_WORKFLOW_WIZARD_VALUES: WorkflowWizardValues = {
  space: null,
  staff: [],
  forms: [],
  sessionQueue: false,
  addItemsEnabled: false,
  addItemsFromLibraryEnabled: false,
}

export const workflowWizardStepSpaceSchema = z.object({
  space: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
    .nullable()
    .refine((value) => value != null, { message: 'Select a space' }),
})

export const workflowWizardStepSpaceOptionalSchema = z.object({
  space: z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
    })
    .nullable(),
})

export function workflowWizardTotalSteps(timeMode: 'duration' | 'window' | undefined): number {
  return timeMode === 'window' ? WORKFLOW_WIZARD_QUEUE_STEPS : WORKFLOW_WIZARD_BASE_STEPS
}

export function parseWorkflowWizardStep(value: number, totalSteps: number): WorkflowWizardStep {
  if (value <= 1) return 1
  if (value >= totalSteps) return totalSteps as WorkflowWizardStep
  return value as WorkflowWizardStep
}
