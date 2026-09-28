import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Body, Button, Muted } from '@webonone/mobile-ui'

type PendingCallStatus = 'pending_confirmation' | 'confirmed' | 'rejected'

export type PendingToolCallRow = {
  toolCallId: string
  name: string
  summary: string
  arguments: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  status: PendingCallStatus
}

export type PendingTool = {
  toolCallId: string
  name: string
  summary: string
  arguments?: Record<string, unknown>
  displayArguments?: Record<string, unknown>
  status: PendingCallStatus
  calls?: PendingToolCallRow[]
}

function pendingRows(pending: PendingTool): PendingToolCallRow[] {
  if (pending.calls && pending.calls.length > 0) {
    return pending.calls
  }
  return [
    {
      toolCallId: pending.toolCallId,
      name: pending.name,
      summary: pending.summary,
      arguments: pending.arguments ?? {},
      displayArguments: pending.displayArguments,
      status: pending.status,
    },
  ]
}

function callItemName(call: PendingToolCallRow): string {
  const name = call.arguments?.name
  return typeof name === 'string' && name.trim() ? name.trim() : 'Item'
}

function formatRecord(record: Record<string, unknown>): string {
  const entries = Object.entries(record).filter(([, value]) => value != null && value !== '')
  if (entries.length === 0) {
    return ''
  }
  return entries
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join('\n')
}

export function PendingAssistantToolCalls({
  pending,
  disabled,
  onConfirm,
  onSkip,
}: {
  pending: PendingTool
  disabled?: boolean
  onConfirm: (toolCallId: string) => void
  onSkip: (toolCallId: string) => void
}) {
  const { t } = useTranslation('shell')
  const rows = pendingRows(pending)
  const hasPending = rows.some((call) => call.status === 'pending_confirmation')

  return (
    <View className="mt-2 gap-2">
      {hasPending ? (
        <Muted className="text-xs">{t('assistant.pendingChange')}</Muted>
      ) : null}
      {rows.map((call) => {
        const record =
          call.displayArguments && Object.keys(call.displayArguments).length > 0
            ? call.displayArguments
            : call.arguments
        const preview = formatRecord(record)
        const name = callItemName(call)

        if (call.status === 'confirmed') {
          return (
            <Muted key={call.toolCallId} className="text-xs">
              {t('assistant.itemAdded', { name })}
            </Muted>
          )
        }
        if (call.status === 'rejected') {
          return (
            <Muted key={call.toolCallId} className="text-xs">
              {t('assistant.itemCanceled', { name })}
            </Muted>
          )
        }

        return (
          <View key={call.toolCallId} className="gap-2 rounded-md border border-border p-2">
            {call.summary ? <Body className="text-xs font-medium">{call.summary}</Body> : null}
            {preview ? <Muted className="text-xs">{preview}</Muted> : null}
            <View className="flex-row gap-2">
              <Button size="sm" disabled={disabled} onPress={() => onConfirm(call.toolCallId)}>
                {t('assistant.confirm')}
              </Button>
              <Button size="sm" variant="outline" disabled={disabled} onPress={() => onSkip(call.toolCallId)}>
                {t('assistant.skip')}
              </Button>
            </View>
          </View>
        )
      })}
    </View>
  )
}

export function toolNameForCall(pending: PendingTool, toolCallId: string): string | null {
  const row = pending.calls?.find((call) => call.toolCallId === toolCallId)
  if (row) return row.name
  if (pending.toolCallId === toolCallId) return pending.name
  return null
}

export function toolArgsForCall(
  pending: PendingTool,
  toolCallId: string,
): Record<string, unknown> | undefined {
  const row = pending.calls?.find((call) => call.toolCallId === toolCallId)
  if (row) return row.arguments
  if (pending.toolCallId === toolCallId) return pending.arguments
  return undefined
}
