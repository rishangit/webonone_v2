import { formatDisplayDateTime } from '@/shared/utils/formatDisplayDate'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatMediaDate(isoDate?: string | null, language?: string): string {
  if (!isoDate) return '—'
  const formatted = formatDisplayDateTime(isoDate, language)
  return formatted || '—'
}
