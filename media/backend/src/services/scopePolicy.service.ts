/** Reserved Support feedback scopes: support:feedback:{uploadSessionId} */
export const SUPPORT_FEEDBACK_SCOPE_REGEX = /^support:feedback:[A-Za-z0-9_-]+$/

export function isSupportFeedbackScope(scope: string): boolean {
  return SUPPORT_FEEDBACK_SCOPE_REGEX.test(scope)
}

export function assertScopeAllowedForUpload(scope: string, mimeType: string): void {
  if (!scope.startsWith('support:')) {
    return
  }
  if (!isSupportFeedbackScope(scope)) {
    throw new Error('Invalid support media scope')
  }
  if (!mimeType.startsWith('image/')) {
    throw new Error('Support feedback attachments must be images')
  }
}

export function assertScopeAllowedForList(scope: string): void {
  if (!scope.startsWith('support:')) {
    return
  }
  if (!isSupportFeedbackScope(scope)) {
    throw new Error('Invalid support media scope')
  }
}
