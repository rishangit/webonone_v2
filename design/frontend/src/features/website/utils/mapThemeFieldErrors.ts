import type { FieldValidationIssue } from '@webonone/ui-kit'

export function mapThemeFieldErrors(issues: FieldValidationIssue[]): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.')
    if (key && !(key in errors)) errors[key] = issue.message
  }
  return errors
}
