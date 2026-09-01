export type EmailDeliveryStatusDateFilterDraft = {
  status: string
  from?: string | null
  to?: string | null
}

export type EmailQueueStatusFilterDraft = {
  status: string
}

export function parseFilterDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function serializeFilterDate(value?: Date): string | null {
  return value ? value.toISOString() : null
}
