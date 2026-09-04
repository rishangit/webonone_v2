import type { FormField } from '@/shared/types/design.types'

export type FormFieldPropertiesPanelState = {
  kind: 'state'
  field: FormField
  fieldIndex: number
  fieldCount: number
}

export type FormFieldPropertiesPanelMessage =
  | { kind: 'field'; field: FormField }
  | { kind: 'move'; direction: -1 | 1 }
  | { kind: 'remove' }

export type FormFieldPropertiesPanelDraft =
  | FormFieldPropertiesPanelState
  | FormFieldPropertiesPanelMessage

export function isFormFieldPropertiesPanelMessage(
  draft: FormFieldPropertiesPanelDraft,
): draft is FormFieldPropertiesPanelMessage {
  return draft.kind === 'field' || draft.kind === 'move' || draft.kind === 'remove'
}

export function isFormFieldPropertiesPanelState(
  draft: FormFieldPropertiesPanelDraft,
): draft is FormFieldPropertiesPanelState {
  return draft.kind === 'state'
}
