function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return true
}

export function schemaMatchesSubschema(
  subschema: Record<string, unknown>,
  args: Record<string, unknown>,
): boolean {
  if (isRecord(subschema.properties)) {
    for (const [key, constraint] of Object.entries(subschema.properties)) {
      if (!isRecord(constraint)) {
        continue
      }
      const value = args[key]
      if ('const' in constraint && value !== constraint.const) {
        return false
      }
      if (Array.isArray(constraint.enum) && !constraint.enum.includes(value)) {
        return false
      }
    }
  }
  if (Array.isArray(subschema.required)) {
    for (const key of subschema.required) {
      if (typeof key === 'string' && !isPresent(args[key])) {
        return false
      }
    }
  }
  return true
}

export function requiredFromSubschema(subschema: Record<string, unknown>): string[] {
  if (!Array.isArray(subschema.required)) {
    return []
  }
  return subschema.required.filter((key): key is string => typeof key === 'string')
}

export function conditionalExclusiveKeys(schema: Record<string, unknown>): Set<string> {
  const baseRequired = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((key): key is string => typeof key === 'string')
      : [],
  )
  const conditionalKeys = new Set<string>()
  const allOf = Array.isArray(schema.allOf) ? schema.allOf : []
  for (const entry of allOf) {
    if (!isRecord(entry)) {
      continue
    }
    const thenSchema = isRecord(entry.then) ? entry.then : null
    if (!thenSchema) {
      continue
    }
    for (const key of requiredFromSubschema(thenSchema)) {
      if (!baseRequired.has(key)) {
        conditionalKeys.add(key)
      }
    }
  }
  return conditionalKeys
}

export function activeConditionalKeys(
  schema: Record<string, unknown>,
  args: Record<string, unknown>,
): Set<string> {
  const active = new Set<string>()
  const allOf = Array.isArray(schema.allOf) ? schema.allOf : []
  for (const entry of allOf) {
    if (!isRecord(entry)) {
      continue
    }
    const ifSchema = isRecord(entry.if) ? entry.if : null
    const thenSchema = isRecord(entry.then) ? entry.then : null
    if (!ifSchema || !thenSchema) {
      continue
    }
    if (!schemaMatchesSubschema(ifSchema, args)) {
      continue
    }
    for (const key of requiredFromSubschema(thenSchema)) {
      active.add(key)
    }
  }
  return active
}

export function filterApplicableConfirmKeys(
  schema: Record<string, unknown>,
  args: Record<string, unknown>,
  keys: string[],
): string[] {
  const exclusive = conditionalExclusiveKeys(schema)
  if (exclusive.size === 0) {
    return keys
  }
  const active = activeConditionalKeys(schema, args)
  return keys.filter((key) => !exclusive.has(key) || active.has(key))
}
