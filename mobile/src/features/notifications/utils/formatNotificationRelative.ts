export function formatNotificationRelative(iso: string, locale: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return locale.startsWith('si') ? 'දැන්' : 'Just now'
  if (minutes < 60) return locale.startsWith('si') ? `${minutes} විනා` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return locale.startsWith('si') ? `${hours} පැය` : `${hours}h`
  const days = Math.floor(hours / 24)
  return locale.startsWith('si') ? `${days} දින` : `${days}d`
}
