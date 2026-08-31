import type { PlatformAiEntityRef } from '@webonone/platform-embed'

export function formatEntityTag(ref: PlatformAiEntityRef): string {
  const label = ref.label.trim()
  if (ref.service === 'webonone') {
    return `[Company ${ref.kind}: ${label}]`
  }
  return `[Data ${ref.kind}: ${label}]`
}

export function insertTextAtCursor(
  value: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number,
): { next: string; caret: number } {
  const before = value.slice(0, selectionStart)
  const after = value.slice(selectionEnd)
  const needsSpaceBefore =
    before.length > 0 && !/\s$/.test(before) && !before.endsWith('[')
  const needsSpaceAfter = after.length > 0 && !/^\s/.test(after)
  const text = `${needsSpaceBefore ? ' ' : ''}${insertion}${needsSpaceAfter ? ' ' : ''}`
  const next = `${before}${text}${after}`
  const caret = before.length + text.length
  return { next, caret }
}
