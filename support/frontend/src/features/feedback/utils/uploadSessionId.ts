export function createFeedbackUploadSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 21)
  }
  return `fb${Date.now()}${Math.random().toString(36).slice(2, 11)}`.slice(0, 21)
}
