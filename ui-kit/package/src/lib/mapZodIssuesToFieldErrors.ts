export interface FieldValidationIssue {
  path: (string | number)[]
  message: string
}

export function mapZodIssuesToFieldErrors<T extends string>(
  issues: FieldValidationIssue[],
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in errors)) {
      errors[key as T] = issue.message
    }
  }
  return errors
}
